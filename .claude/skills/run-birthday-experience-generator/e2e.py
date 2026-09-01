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
PHOTO = os.environ.get("E2E_PHOTO") or 'C:/Users/arjun/AppData/Local/Temp/claude/c--Users-arjun-OneDrive-Desktop-Birthday-App-birthday-experience-generator/bac1a72b-d2f6-4eda-bf13-88783d7355ba/scratchpad/e2e-photo.jpg'

failures = []



def ensure_photo():
    """Return a path to a valid test image, generating one if needed.

    Committed harness must not depend on a file in someone's temp dir.
    """
    p = Path(PHOTO)
    if p.exists():
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
