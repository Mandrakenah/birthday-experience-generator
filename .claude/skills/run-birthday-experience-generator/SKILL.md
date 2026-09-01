---
name: run-birthday-experience-generator
description: Build, run, screenshot, and smoke-test the Birthday Experience Generator Next.js app locally. Use when asked to run/start/launch the app, take a screenshot of a page, check a route renders, or verify a change works in the real running app.
---

# Run the Birthday Experience Generator

Next.js 16 (Turbopack) + React 19 + Tailwind 4 + Supabase. Driven headlessly by
`driver.py` in this skill directory: `smoke` uses only the Python stdlib,
`flow` and `shot` use Playwright.

All paths below are relative to the app root (the directory holding
`package.json`). Verified on Windows 11 / Git Bash, Node + npm 11.4.2.

## Setup

`node_modules` is not committed and must not be copied between machines
(native binaries differ). From a clean checkout:

```bash
npm install
```

Takes ~4 minutes and reports 6 high-severity advisories. Leave them — fixing
forces an upgrade off the pinned `next@16.2.9`.

`.env.local` is required and already exists with **placeholder** Supabase keys.
The app builds and runs with them; see Gotchas for what that changes.

## Run

Start the dev server in the background and wait for it to be ready:

```bash
npm run dev > /tmp/nextdev.log 2>&1 &
until grep -q "Ready in" /tmp/nextdev.log; do sleep 0.5; done; cat /tmp/nextdev.log
```

Ready in ~5s at http://localhost:3000. The **first** request to any route costs
an extra ~6s while Turbopack compiles it; that is not a hang.

## Drive it (agent path)

`python` here can be any interpreter — if it lacks Playwright, the driver finds
one that has it and re-execs (prints `[driver] using <path>`).

```bash
# every key route: status, wall time, heading. stdlib only, no browser.
python .claude/skills/run-birthday-experience-generator/driver.py smoke

# landing -> hero CTA -> signup -> fill -> submit, screenshotting each step
python .claude/skills/run-birthday-experience-generator/driver.py flow

# screenshot specific routes
python .claude/skills/run-birthday-experience-generator/driver.py shot / login b/test-slug

# FULL end-to-end against live Supabase (needs real keys in .env.local):
# signup -> create -> upload photo -> theme -> publish -> view /b/<slug>
# anonymously -> confirm a second account cannot see the first's projects
python .claude/skills/run-birthday-experience-generator/e2e.py
```

`e2e.py` prints `[PASS]`/`[FAIL]` per step and exits non-zero if any fail. It signs
up a fresh throwaway account each run (`e2e-<timestamp>@example.com`), so it is
safe to re-run, but it does leave real users and projects in the Supabase project.

Screenshots land in `.driver-shots/` (gitignored). **Open them and look.**

Exit code is 0 only when nothing unexpected happened. `flow` deliberately
ignores the two console errors that placeholder Supabase keys always produce,
so a non-zero exit means a real regression.

Expected `smoke` output:

```
/              200   0.07s   38506b  Give them a birthday they can step into
/login         200   0.05s   23821b  Welcome back
/signup        200   0.05s   24682b  Create your account
/dashboard     200   0.08s   23821b  Welcome back
/b/test-slug   200   7.19s   35134b  Birthday Experience Generator  [renders 404 - expected without real Supabase keys]
```

`/dashboard` reporting **"Welcome back"** is correct, not a bug: `proxy.ts` gates it
server-side and 307s an unauthenticated request to `/login`, which `smoke` follows.

Override the target with `BASE_URL`, the screenshot dir with `DRIVER_SHOTS`.

## Verify before committing

```bash
npm run verify   # lint + typecheck + build
```

There is no test suite.

## Gotchas

- **Placeholder Supabase keys are the default state, and they look like bugs.**
  `NEXT_PUBLIC_SUPABASE_URL` points at a host that does not resolve. Consequences,
  all expected: `/b/<slug>` spends ~7s in application code then renders its themed
  "This birthday card couldn't be found" page; signup/login show **"Failed to
  fetch"**; the browser console carries `ERR_NAME_NOT_RESOLVED`. Nothing is broken.
  Real keys (see `supabase/SETUP.md`) fix all of it. Restart `npm run dev` after
  editing env and confirm `- Environments: .env.local` appears in the log.

- **RLS policies are OR'd — never rely on RLS alone to scope a read to the owner.**
  `Public reads published projects` sits alongside the owner policy, so a bare
  `select()` on `birthday_projects` returns every user's *published* rows to any
  caller. Both `/api/projects` (GET) and `/api/upload` now compare `creator_id`
  explicitly; do the same in any new query. Verified live: drafts stay private and
  cross-account UPDATE/DELETE affect zero rows, but published rows are readable by
  anyone — which is required for `/b/<slug>` to work for strangers.

- **Publishing needs a photo.** `canPublish = recipient.trim() && photos.length > 0`
  (`app/editor/[id]/page.tsx`). The publish control is a **toggle switch** with
  `aria-label="Publish"` and no text, so it is invisible to text-based button
  scans — find it with `get_by_role("switch", name="Publish")`.

- **Protected routes redirect, so a 200 is not proof you reached the page.** `proxy.ts`
  gates `/dashboard` and `/editor/*` server-side — unauthenticated requests get a
  `307` to `/login`, and both `curl -L` and `smoke` follow it and report 200 for what
  is really the login page. Check the heading, or use `shot`, which prints the
  *settled* URL and flags `(redirected)`. Trust that line over the HTTP status.
  (`curl -o /dev/null -D - http://localhost:3000/dashboard` shows the raw 307.)

- **`proxy.ts` costs nothing on anonymous requests.** It calls `getUser()` on every
  matched route, which looks like it should add the ~7s placeholder-key stall to the
  whole app. It does not: with no session cookie, auth-js returns null without a
  network call, so `/login` and `/signup` still serve in ~0.1s. Only routes that query
  the database themselves (`/b/<slug>`) pay the stall.

- **Never read `page.url` straight after clicking a link.** It races the client-side
  transition and still shows the old URL, which looks exactly like the frozen-navigation
  failure `.claude/HANDOFF.md` warns about. Use `wait_for_url()`. Client-side nav is
  fine; a naive check will send you chasing a phantom bug.

- **`wait_for_url()` is not enough before a screenshot.** It fires on the URL change,
  while the route's suspense boundary is still showing a spinner — you get a screenshot
  of an empty page with a purple ring and no error anywhere. Wait for real content
  (`wait_for_selector("input[type=email]")`) before capturing. Interactions are immune
  (Playwright auto-waits on locators); only screenshots lie. **Always open the PNG.**

- **The signup form has two password inputs** (password + confirm). `fill("input[type=password]", …)`
  hits only the first and the submit fails with "Passwords do not match" — a
  client-side validation error that can be mistaken for a backend failure. Fill both.
  The submit button reads **"Sign up"**, not "Create account".

- **Git Bash mangles leading-slash arguments.** `driver.py shot /login` arrives as
  `C:/Program Files/Git/login`. The driver undoes this, and also accepts the
  slashless form (`shot login`), which is never mangled.

- **Keep driver output ASCII.** The Windows console is cp1252 and raises
  `UnicodeEncodeError` on check marks and box-drawing characters.

- **This directory is not its own git repo.** `git rev-parse --show-toplevel` returns
  `C:/Users/arjun` — the whole home directory. So Next.js picks
  `C:\Users\arjun\package-lock.json` as the workspace root and warns about multiple
  lockfiles on every start (harmless; silence it with `turbopack.root` in
  `next.config.ts`). More importantly, **committing here commits into the home-directory
  repo.** `.claude/HANDOFF.md` step 2 says to `git init` in this directory; that has
  not been done.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Build error occurred / EPERM: operation not permitted, unlink '.next\static\...'` | `npm run verify` was run while `npm run dev` was live — they share `.next` and Windows locks it. Stop the dev server first (`Get-NetTCPConnection -LocalPort 3000 -State Listen \| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`), then `rm -rf .next && npm run verify`. |
| `driver.py`: `CONNECT FAILED` | Dev server is not up. Run the `npm run dev` block above. |
| `No Python with playwright found` | Follow the exact `pip install playwright && playwright install chromium` line the driver prints for your interpreter. |
| `Page.goto: Cannot navigate to invalid URL` with `Program Files/Git` in the path | Git Bash path mangling — drop the leading slash (`shot login`). |
| First route request takes ~6s | Turbopack compiling on demand. Only the first hit per route. |
| Only the landing page renders, links dead | `.env.local` missing or its `NEXT_PUBLIC_*` values empty — the browser Supabase client throws and freezes client-side nav. Non-empty placeholders are enough to avoid this. |
