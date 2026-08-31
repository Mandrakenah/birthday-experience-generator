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
- It has **never been run against a real Supabase project** — that's the main thing left.

## FIRST STEPS on this (new) laptop — do these in order

1. `npm install` (do NOT copy `node_modules` across machines — native binaries differ).
2. `git init` — the previous machine's `.git` was **corrupt** (`fatal: bad object HEAD`).
   The working files are all intact; just start a fresh history. Committing here is fine
   (the old "don't commit" rule was specific to the previous work laptop).
3. Create the real `.env.local` from `.env.example` and run the Supabase setup:
   see [`../supabase/SETUP.md`](../supabase/SETUP.md) — run migrations **0001, 0002, 0003**,
   create the public `birthday-media` bucket, enable Email auth (confirmation OFF), then
   fill the 4 keys in `.env.local`.
4. `npm run dev` → http://localhost:3000.

### ⚠️ Gotcha that will waste your time otherwise
`.env.local` **must exist with non-empty** `NEXT_PUBLIC_SUPABASE_URL` + `..._ANON_KEY`, or
the browser Supabase client throws and **freezes client-side navigation** (only the landing
page renders). With *placeholder* keys the app runs but every server-side Supabase call
**hangs ~7s then fails**, so auth redirects/404s look broken — that's the fake host, not a
bug. Real keys fix it. Restart `npm run dev` after editing env (look for
`- Environments: .env.local` in the log).

## What still needs doing

- **End-to-end test** (after Supabase is live): sign up → create project → upload photos →
  write message/pick theme → publish → open `/b/[slug]` in incognito. Confirm RLS blocks
  reading another user's draft.
- **Re-verify the 2026-08-31 audit fixes against real Supabase.** All six pass
  `npm run verify` but none has run against a live backend: the `custom_theme` autosave
  loop (`CustomThemeEditor`), the background upload above, `/api/upload` ownership +
  music/video replacement, photo `sort_order`, the mic tap-escape, and the newly added
  root `proxy.ts` (session refresh + `/dashboard`/`/editor` gating, which was documented
  as shipped but did not exist). To drive any of it, use
  `/run-birthday-experience-generator`.
- **Custom theme background-photo upload** — DONE, but **never run against real
  Supabase**. It now uploads to Storage and persists the public URL
  (`CustomThemeEditor.onBgImage`). It deliberately writes no `project_media` row, or the
  background would also appear in the photo slideshow. Verify this on the first real run.
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
