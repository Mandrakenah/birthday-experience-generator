# HANDOFF — read this first

This is the **Birthday Experience Generator** (Next.js 16 / React 19 / Tailwind 4 /
Supabase). This file is the single source of truth for picking the project up on a new
machine. It travels with the repo (the chat-based memory does NOT).

## TL;DR — what state it's in

- The full MVP **and** post-MVP work is written and on disk. `npm run verify`
  (lint + typecheck + build) passes, and the app **builds with no env keys**.
- What's been built beyond the original spec: SVG icon set (no emoji), a product-first
  landing page with an animated phone preview, **7 themes** (the original 5 + `sweetheart`
  cute/hearts + `custom` full page-builder), and a professional light+violet restyle of
  the entire creator UI. The recipient experience at `/b/[slug]` stays colorful/themed.
- **It now runs end-to-end against a real Supabase project** (verified 2026-08-31):
  signup → create → upload → publish → anonymous `/b/<slug>`, plus cross-account
  isolation. Re-run with `.claude/skills/run-birthday-experience-generator/e2e.py`.
- Repo is live at https://github.com/Mandrakenah/birthday-experience-generator (public, MIT).
- Next up: deploy (`DEPLOY.md`) and prod hardening (`SECURITY.md`).

## FIRST STEPS on this (new) laptop — do these in order

1. `npm install` (do NOT copy `node_modules` across machines — native binaries differ).
2. `git clone https://github.com/Mandrakenah/birthday-experience-generator` — history now
   lives on GitHub. (The original machine's `.git` was corrupt; a fresh history was
   started 2026-08-31 and pushed.)
3. Create `.env.local` from `.env.example` and fill the 4 values. The Supabase project
   (`For Her`, ca-central-1) is already provisioned with schema, RLS, the
   `birthday-media` bucket, and Email auth with confirmation OFF — you only need the
   keys from Project Settings → API Keys. For a **fresh** Supabase project instead,
   see [`../supabase/SETUP.md`](../supabase/SETUP.md); note the bucket can be created in
   SQL rather than by hand.
4. `npm run dev` → http://localhost:3000, then `e2e.py` to confirm the whole flow.

### ⚠️ Gotcha that will waste your time otherwise
`.env.local` **must exist with non-empty** `NEXT_PUBLIC_SUPABASE_URL` + `..._ANON_KEY`, or
the browser Supabase client throws and **freezes client-side navigation** (only the landing
page renders). With *placeholder* keys the app runs but every server-side Supabase call
**hangs ~7s then fails**, so auth redirects/404s look broken — that's the fake host, not a
bug. Real keys fix it. Restart `npm run dev` after editing env (look for
`- Environments: .env.local` in the log).

## What still needs doing

- **End-to-end test** — DONE (2026-08-31), all green against a real Supabase project
  (`For Her`, ca-central-1). signup -> create -> upload photo -> theme -> publish ->
  open `/b/<slug>` anonymously -> second account sees none of the first's projects.
  Re-run any time with `.claude/skills/run-birthday-experience-generator/e2e.py`.
- **Custom theme background upload is still unverified against real Storage.** The
  e2e uses the Sweetheart theme; nobody has exercised `CustomThemeEditor.onBgImage`
  against live Supabase yet.
- **Test data lives in the Supabase project**: users `e2e-*@example.com`,
  `rls-*@example.com`, `atk-*@example.com`, `probe*@example.com`, `smoke@example.com`,
  plus their projects and uploaded photos. Delete before going live.
- **Audit-fix verification status** (fixes made 2026-08-31). Exercised live by the e2e:
  `proxy.ts` gating, `/api/upload` (photo path), publish, and the anonymous recipient
  view. NOT yet exercised live: the `custom_theme` autosave loop, the background-photo
  upload, music/video replacement, photo `sort_order` after a delete, and the mic
  tap-escape.
- **`/api/projects` GET leaked other users' published projects** into any signed-in
  user's dashboard — RLS policies are OR'd, so `Public reads published projects`
  satisfied the bare select. Caught by the e2e's RLS check and fixed with an explicit
  `.eq('creator_id', user.id)`. An earlier code audit flagged this and a verifier
  wrongly refuted it: **trust the live check over the review.**
- **Device QA**: real iPhone Safari for the mic blow-out (`useMicrophone`), Android Chrome.
- **Deploy**: see [`../DEPLOY.md`](../DEPLOY.md). Set `NEXT_PUBLIC_APP_URL` to the real origin.
- **Prod hardening**: see [`../SECURITY.md`](../SECURITY.md) (re-enable email confirmation,
  consider rate-limiting `/api/*`). `npm audit` shows 2 moderate build-time postcss
  advisories via Next — deferred (fixing forces a Next upgrade off pinned 16.2.9).

## How to work in this repo (important)

- **The stack is newer than the spec assumes.** Before changing code, read
  [`../SPEC_PATCHES.md`](../SPEC_PATCHES.md) — it's authoritative wherever the spec (written
  for Next 14 / React 18 / Tailwind 3) conflicts with the installed Next 16 / React 19 /
  Tailwind 4 stack. Also read the bundled Next 16 docs in `node_modules/next/dist/docs/`
  (e.g. `middleware.ts` is now `proxy.ts`; client pages unwrap `params` with `use()`).
- Next 16 lint is strict: no sync `setState` in effects; no self-referencing `useCallback`.
- The original spec docx lives OUTSIDE the repo (`../Birthday_Experience_Generator_Spec.docx`
  / `../_spec_text.txt`) and may NOT have been copied over. `SPEC_PATCHES.md` + this file
  capture the essentials; copy the docx too if you want the full original spec.
- Other docs: [`../README.md`](../README.md) (setup/overview), `../DEPLOY.md`, `../SECURITY.md`.
- The owner prefers **lean, no-bloat code** — delete/don't-write over adding; flag
  over-engineering.

## Useful commands

- `npm run dev` — local dev server
- `npm run verify` — lint + typecheck + build (the gate; CI runs this too)
- `npm run zip` — clean archive for copying (excludes node_modules/.next/.git)
