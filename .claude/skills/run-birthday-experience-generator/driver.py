#!/usr/bin/env python3
"""Driver for the Birthday Experience Generator dev server.

  smoke            stdlib only - GET every key route, print status/time/heading
  flow             Playwright - landing -> CTA -> signup -> submit, screenshots each step
  shot <route>...  Playwright - screenshot one or more routes

The dev server must already be running (see SKILL.md). Output is ASCII only:
the Windows console is cp1252 and dies on box-drawing/check characters.
"""
import os
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

UNIT = Path(__file__).resolve().parents[3]
SHOTS = Path(os.environ.get("DRIVER_SHOTS") or UNIT / ".driver-shots")
BASE = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")

ROUTES = ["/", "/login", "/signup", "/dashboard", "/b/test-slug"]

# Console noise that placeholder Supabase keys always produce. These mean the
# fake host did not resolve - not that the app is broken.
EXPECTED_ERRORS = ("ERR_NAME_NOT_RESOLVED", "Failed to fetch")

# Placeholder Supabase keys make server-side calls hang ~7s before failing,
# so nothing here may use the usual 5s timeout.
TIMEOUT = 30


def _text(html, pattern):
    m = re.search(pattern, html, re.I | re.S)
    return re.sub(r"<[^>]*>", "", m.group(1)).strip()[:60] if m else ""


def smoke():
    print("BASE = %s\n" % BASE)
    bad = []
    for route in ROUTES:
        url = BASE + route
        t0 = time.time()
        try:
            with urlopen(url, timeout=TIMEOUT) as r:
                status, body = r.status, r.read().decode("utf-8", "replace")
        except HTTPError as e:
            status, body = e.code, e.read().decode("utf-8", "replace")
        except URLError as e:
            print("%-14s CONNECT FAILED: %s" % (route, e.reason))
            print("\nIs the dev server up? -> npm run dev")
            return 1
        dt = time.time() - t0
        head = _text(body, r"<h1[^>]*>(.*?)</h1>") or _text(body, r"<title[^>]*>(.*?)</title>")
        is404 = "404" in body and "not found" in body.lower()
        note = "  [renders 404 - expected without real Supabase keys]" if is404 else ""
        print("%-14s %s  %5.2fs  %6db  %s%s" % (route, status, dt, len(body), head, note))
        if status >= 400:
            bad.append(route)
    print("\n%d/%d routes returned 2xx/3xx" % (len(ROUTES) - len(bad), len(ROUTES)))
    return 1 if bad else 0


def _reexec_with_playwright():
    """Playwright is not a project dependency; it lives in whatever Python has it.

    If the interpreter running us cannot import it, find one that can and hand
    off. Keeps `python driver.py flow` working no matter which python is first
    on PATH. Sets DRIVER_REEXEC so we only ever bounce once.
    """
    try:
        import playwright  # noqa: F401
        return
    except ImportError:
        pass
    if os.environ.get("DRIVER_REEXEC"):
        print("No Python with playwright found. Install it into this one:")
        print("  %s -m pip install playwright && %s -m playwright install chromium"
              % (sys.executable, sys.executable))
        sys.exit(3)

    import glob
    import subprocess

    home = Path.home()
    cands = sorted(glob.glob(str(home / "anaconda3/envs/*/python.exe")))
    cands += sorted(glob.glob(str(home / "miniconda3/envs/*/python.exe")))
    cands += [str(home / "anaconda3/python.exe"), "python3", "python"]
    for c in cands:
        if c == sys.executable:
            continue
        try:
            subprocess.run([c, "-c", "import playwright"], check=True,
                           capture_output=True, timeout=60)
        except Exception:
            continue
        print("[driver] using %s" % c)
        sys.stdout.flush()  # else the parent's buffer flushes after the child's
        env = dict(os.environ, DRIVER_REEXEC="1")
        sys.exit(subprocess.run([c, str(Path(__file__).resolve())] + sys.argv[1:],
                                env=env).returncode)
    os.environ["DRIVER_REEXEC"] = "1"
    _reexec_with_playwright()


def _page(p):
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    errs = []
    pg.on("console", lambda m: errs.append("CONSOLE: " + m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    return b, pg, errs


def _save(pg, name):
    SHOTS.mkdir(parents=True, exist_ok=True)
    path = SHOTS / name
    pg.screenshot(path=str(path))
    print("  shot -> %s" % path)


def flow():
    from playwright.sync_api import sync_playwright

    rc = 0
    with sync_playwright() as p:
        b, pg, errs = _page(p)

        print("1. landing page")
        pg.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        print("  title: %s" % pg.title())
        _save(pg, "01-landing.png")

        print("2. click the hero CTA")
        pg.get_by_role("link", name="Create a birthday experience").first.click()
        # Must wait_for_url. Reading pg.url straight after click races the
        # client-side transition and falsely looks like nav is frozen.
        try:
            pg.wait_for_url("**/signup", timeout=20000)
            print("  client-side nav OK -> %s" % pg.url)
        except Exception:
            print("  NAV FAILED - still at %s" % pg.url)
            rc = 1
        # wait_for_url fires on the URL change, before the route's suspense
        # boundary resolves - screenshotting here catches a bare spinner.
        # Wait for real content.
        pg.wait_for_selector("input[type=email]", state="visible", timeout=30000)
        _save(pg, "02-signup.png")

        print("3. fill + submit the signup form")
        pg.fill("input[type=email]", "smoke@example.com")
        pw = pg.locator("input[type=password]")
        # Two password inputs (password + confirm). Filling by selector alone
        # only fills the first and trips "Passwords do not match".
        for i in range(pw.count()):
            pw.nth(i).fill("hunter2hunter2")
        pg.get_by_role("button", name="Sign up").first.click()
        pg.wait_for_timeout(15000)
        body = " ".join(pg.inner_text("body").split())
        print("  url: %s" % pg.url)
        print("  visible: %s" % body[:200])
        _save(pg, "03-after-submit.png")

        if "Failed to fetch" in body:
            print("\n  -> 'Failed to fetch' is EXPECTED with placeholder Supabase keys.")
            print("     The form works; the fake host just does not resolve.")
        elif "/dashboard" in pg.url:
            print("\n  -> Signed up and redirected. Real Supabase keys are live.")

        unexpected = [e for e in errs if not any(x in e for x in EXPECTED_ERRORS)]
        print("")
        print("console/page errors: %d total, %d unexpected" % (len(errs), len(unexpected)))
        for e in unexpected:
            print("  " + e.splitlines()[0])
            rc = 1
        b.close()
    return rc


def _route(arg):
    """Normalise a route argument.

    Git Bash (MSYS) rewrites a bare leading-slash argument into a Windows path,
    so `shot /login` arrives as `C:/Program Files/Git/login`. Undo that, and
    accept the slashless form (`shot login`) which never gets mangled.
    """
    if "/Git/" in arg:
        arg = arg.split("/Git/", 1)[1]
    return "/" + arg.lstrip("/")


def shot(routes):
    from playwright.sync_api import sync_playwright

    routes = [_route(r) for r in routes]
    with sync_playwright() as p:
        b, pg, errs = _page(p)
        for route in routes:
            pg.goto(BASE + route, wait_until="networkidle", timeout=60000)
            name = (route.strip("/").replace("/", "-") or "home") + ".png"
            # Auth guards run client-side, so the settled URL is the real
            # answer. curl reports 200 for /dashboard; the browser lands on
            # /login. Always report where we actually ended up.
            pg.wait_for_timeout(1500)
            landed = pg.url[len(BASE):] or "/"
            arrow = "  (redirected)" if landed.rstrip("/") != route.rstrip("/") else ""
            print("%s -> %s%s" % (route, landed, arrow))
            _save(pg, name)
        unexpected = [e for e in errs if not any(x in e for x in EXPECTED_ERRORS)]
        print("console/page errors: %d total, %d unexpected" % (len(errs), len(unexpected)))
        for e in unexpected:
            print("  " + e.splitlines()[0])
        b.close()
    return 0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "smoke"
    if cmd == "smoke":
        sys.exit(smoke())
    elif cmd == "flow":
        _reexec_with_playwright()
        sys.exit(flow())
    elif cmd == "shot":
        _reexec_with_playwright()
        sys.exit(shot(sys.argv[2:] or ["/"]))
    else:
        print(__doc__)
        sys.exit(2)
