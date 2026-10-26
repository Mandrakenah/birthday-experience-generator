#!/usr/bin/env python3
"""Full end-to-end against a live Supabase project.

signup -> create project -> set recipient/message/theme -> publish ->
open /b/<slug> in a clean anonymous context -> check RLS blocks a draft.

Needs a dev server running with real keys. Output is ASCII only (cp1252).
"""
import os
import sys
import time
from pathlib import Path

UNIT = Path(__file__).resolve().parents[3]
SHOTS = Path(os.environ.get("DRIVER_SHOTS") or UNIT / ".driver-shots")
BASE = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")

# Unique per run so reruns never collide on the email.
STAMP = os.environ.get("E2E_STAMP") or str(int(time.time()))
EMAIL = "e2e-%s@example.com" % STAMP
PW = "hunter2hunter2"
RECIPIENT = "Mom"
CAPTION = "Beach day %s" % STAMP
WISH = "Have the best day ever %s" % STAMP
PHOTO = os.environ.get("E2E_PHOTO") or ""

failures = []


def anon_html(browser, path):
    """Server-rendered HTML of `path` for a visitor with no cookies.

    Client component props (the experience data) are serialized into it, so
    this shows exactly what a recipient's browser receives.
    """
    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(BASE + path, wait_until="networkidle", timeout=60000)
    html = page.content()
    ctx.close()
    return html


def ensure_photo():
    """Return a path to a valid test image, generating one if needed.

    Committed harness must not depend on a file in someone's temp dir.
    """
    p = Path(PHOTO)
    if PHOTO and p.exists():
        return str(p)
    p = SHOTS / "e2e-photo.jpg"
    SHOTS.mkdir(parents=True, exist_ok=True)
    if p.exists():
        return str(p)
    try:
        from PIL import Image, ImageDraw

        im = Image.new("RGB", (900, 1200))
        d = ImageDraw.Draw(im)
        for y in range(1200):
            d.line([(0, y), (900, y)], fill=(255, 180 + int(60 * y / 1200), 200))
        d.ellipse([300, 450, 600, 750], fill=(220, 80, 140))
        im.save(str(p), "JPEG", quality=88)
    except ImportError:
        # Minimal valid 1x1 PNG - enough to satisfy validateFile + Storage.
        import base64

        p = SHOTS / "e2e-photo.png"
        p.write_bytes(base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8"
            "z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="))
    return str(p)


def check(label, ok, detail=""):
    print("  [%s] %s%s" % ("PASS" if ok else "FAIL", label, (" - " + detail) if detail else ""))
    if not ok:
        failures.append(label)
    return ok


def save(pg, name):
    SHOTS.mkdir(parents=True, exist_ok=True)
    pg.screenshot(path=str(SHOTS / name))


def main():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1280, "height": 900})
        pg = ctx.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))

        print("1. sign up as %s" % EMAIL)
        pg.goto(BASE + "/signup", wait_until="networkidle", timeout=60000)
        pg.fill("input[type=email]", EMAIL)
        pws = pg.locator("input[type=password]")
        for i in range(pws.count()):
            pws.nth(i).fill(PW)
        pg.get_by_role("button", name="Sign up").first.click()
        pg.wait_for_url("**/dashboard", timeout=45000)
        check("signup -> session -> /dashboard", "/dashboard" in pg.url, pg.url)
        save(pg, "e2e-01-dashboard.png")

        print("2. create a project")
        pg.get_by_role("button", name="New birthday").first.click()
        pg.wait_for_url("**/editor/**", timeout=45000)
        project_id = pg.url.rstrip("/").split("/")[-1]
        check("project created -> /editor/<id>", bool(project_id), project_id)
        pg.wait_for_selector("input", state="visible", timeout=30000)
        save(pg, "e2e-02-editor.png")

        print("3. fill recipient + message, upload a photo, pick a theme")
        rec = pg.get_by_placeholder("Who's this birthday for?")
        rec.wait_for(state="visible", timeout=30000)
        rec.fill(RECIPIENT)
        areas = pg.locator("textarea")
        for i in range(min(areas.count(), 2)):
            areas.nth(i).fill("Happy birthday! End-to-end test %s." % STAMP)

        # A photo is mandatory: canPublish = recipient set AND photos.length > 0.
        pg.locator("input[type=file]").first.set_input_files(ensure_photo())
        deadline = time.time() + 90
        uploaded = False
        while time.time() < deadline:
            if "Add a recipient name and at least one photo" not in pg.inner_text("body"):
                uploaded = True
                break
            pg.wait_for_timeout(2000)
        check("photo uploaded to Storage + project_media row", uploaded)
        photo_url = pg.locator("ol img").first.get_attribute("src") if uploaded else None
        cap = pg.get_by_placeholder("Add a caption (optional)")
        if cap.count():
            cap.first.fill(CAPTION)
            cap.first.press("Enter")  # blurs -> saves
            pg.wait_for_timeout(1500)
        save(pg, "e2e-03-filled.png")

        theme_btn = pg.get_by_role("button", name="Sweetheart")
        if theme_btn.count():
            theme_btn.first.click()
            pg.wait_for_timeout(2500)
            check("theme selected", True, "sweetheart")

        print("4. publish (toggle switch, aria-label=Publish)")
        sw = pg.get_by_role("switch", name="Publish")
        check("publish switch present", sw.count() > 0)
        enabled = sw.first.is_enabled() if sw.count() else False
        check("publish switch enabled (canPublish)", enabled)
        if enabled:
            sw.first.click()
            pg.wait_for_timeout(6000)
        save(pg, "e2e-04-published.png")

        slug = None
        import re
        m = re.search(r"/b/([a-zA-Z0-9-]+)", pg.inner_text("body"))
        if m:
            slug = m.group(1)
        if not slug:
            r = pg.request.get(BASE + "/api/projects")
            if r.ok:
                for proj in r.json().get("projects", []):
                    if proj.get("id") == project_id:
                        slug = proj.get("slug")
        check("slug generated", bool(slug), str(slug))

        print("5. open /b/%s anonymously (fresh context, no cookies)" % slug)
        if slug:
            anon = b.new_context(viewport={"width": 430, "height": 900})
            ap = anon.new_page()
            aerrs = []
            ap.on("pageerror", lambda e: aerrs.append(str(e)))
            ap.goto("%s/b/%s" % (BASE, slug), wait_until="networkidle", timeout=60000)
            ap.wait_for_timeout(2500)
            atext = ap.inner_text("body")
            check("anonymous can open published page", "couldn't be found" not in atext,
                  atext[:80].replace("\n", " "))
            check("recipient name renders", RECIPIENT.lower() in atext.lower(),
                  atext[:80].replace("\n", " "))
            check("no page errors on experience", not aerrs, "; ".join(aerrs[:2]))
            SHOTS.mkdir(parents=True, exist_ok=True)
            ap.screenshot(path=str(SHOTS / "e2e-05-recipient.png"))
            anon.close()

        print("6. RLS: a second account must not read the first's draft")
        pg2 = b.new_context().new_page()
        pg2.goto(BASE + "/signup", wait_until="networkidle", timeout=60000)
        other = "e2e-b-%s@example.com" % STAMP
        pg2.fill("input[type=email]", other)
        pws2 = pg2.locator("input[type=password]")
        for i in range(pws2.count()):
            pws2.nth(i).fill(PW)
        pg2.get_by_role("button", name="Sign up").first.click()
        pg2.wait_for_url("**/dashboard", timeout=45000)
        r2 = pg2.request.get(BASE + "/api/projects")
        ids = [x.get("id") for x in r2.json().get("projects", [])] if r2.ok else []
        check("account B cannot see account A's project via /api/projects",
              project_id not in ids, "B sees %d project(s)" % len(ids))
        # The dashboard queries Supabase directly from the browser, not via
        # /api/projects - it leaked published projects before. Check the UI.
        pg2.wait_for_selector("text=No birthday experiences yet", timeout=30000)
        check("account B's dashboard UI lists none of A's projects",
              CAPTION not in pg2.content() and "/editor/%s" % project_id not in pg2.content())
        r = pg2.request.patch(BASE + "/api/projects",
                              data={"id": project_id, "recipient": "hijacked"})
        check("account B cannot PATCH A's project", r.status == 404, str(r.status))
        pg2.context.close()

        print("7. caption persisted and served to the recipient")
        if slug:
            html = anon_html(b, "/b/%s" % slug)
            check("caption in published page data", CAPTION in html)

        print("8. friends' wishes: enable, submit anonymously, appear in the experience")
        pg.goto("%s/editor/%s" % (BASE, project_id), wait_until="networkidle", timeout=60000)
        ws = pg.get_by_role("switch", name="Collect wishes from friends")
        has_extras = ws.count() > 0
        check("extras panel present (migration 0004 applied)", has_extras)
        if has_extras and slug:
            ws.first.click()
            pg.wait_for_timeout(2500)
            anon = b.new_context()
            wp = anon.new_page()
            wp.goto("%s/wish/%s" % (BASE, project_id), wait_until="networkidle", timeout=60000)
            wp.get_by_label("Your name").fill("Auntie E2E")
            wp.get_by_label("Your wish").fill(WISH)
            wp.get_by_role("button", name="Send my wish").click()
            wp.wait_for_selector("text=Your wish is in!", timeout=30000)
            check("wish submitted via /wish/<id>", True)
            anon.close()
            check("wish appears in published page data", WISH in anon_html(b, "/b/%s" % slug))

            r = pg.request.post(BASE + "/api/wishes", data={
                "projectId": project_id, "name": "x", "message": "y" * 500})
            check("over-long wish rejected", r.status == 400, str(r.status))

        print("9. scheduled reveal withholds the content until it's time")
        if has_extras and slug:
            from datetime import datetime, timedelta, timezone
            future = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
            r = pg.request.patch(BASE + "/api/projects",
                                 data={"id": project_id, "reveal_at": future})
            check("reveal_at saved", r.ok, str(r.status))
            html = anon_html(b, "/b/%s" % slug)
            check("countdown shown before reveal", "It unlocks in" in html)
            check("photos/messages not sent before reveal",
                  photo_url not in html and CAPTION not in html and WISH not in html)
            pg.request.patch(BASE + "/api/projects", data={"id": project_id, "reveal_at": None})
            check("experience back after clearing reveal",
                  CAPTION in anon_html(b, "/b/%s" % slug))

        print("10. custom theme values are sanitized server-side")
        evil = {"bgFrom": "red), url(https://evil.example/t.png", "bgTo": "#123456",
                "backgroundImage": "https://evil.example/pixel.png",
                "stickers": [{"id": "s", "kind": "nope", "x": 9, "y": 9, "size": 1}]}
        r = pg.request.patch(BASE + "/api/projects",
                             data={"id": project_id, "custom_theme": evil})
        ct = (r.json().get("project") or {}).get("custom_theme") or {} if r.ok else {}
        check("hostile color replaced", ct.get("bgFrom", "").startswith("#")
              and "url(" not in str(ct), str(ct.get("bgFrom")))
        check("foreign background URL dropped", ct.get("backgroundImage") is None)
        check("unknown sticker kind dropped", ct.get("stickers") == [])
        check("valid color kept", ct.get("bgTo") == "#123456")

        print("11. auth redirects")
        anon = b.new_context()
        ap = anon.new_page()
        ap.goto("%s/editor/%s" % (BASE, project_id), wait_until="networkidle", timeout=60000)
        check("signed-out /editor -> /login?next=", "/login?next=" in ap.url, ap.url)
        anon.close()
        pg.goto(BASE + "/login", wait_until="networkidle", timeout=60000)
        check("signed-in /login -> /dashboard", pg.url.rstrip("/").endswith("/dashboard"), pg.url)

        print("12. deleting the project removes its files from Storage")
        before = pg.request.get(photo_url).status if photo_url else 0
        r = pg.request.delete(BASE + "/api/projects", data={"id": project_id})
        check("project deleted", r.ok, str(r.status))
        after = pg.request.get(photo_url).status if photo_url else 0
        check("photo file gone from Storage", before == 200 and after in (400, 404),
              "before=%s after=%s" % (before, after))

        print("")
        print("console errors (creator session): %d" % len(errs))
        for e in errs[:3]:
            print("  " + e.splitlines()[0][:120])
        b.close()

    print("")
    if failures:
        print("FAILED: %s" % ", ".join(failures))
        return 1
    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
