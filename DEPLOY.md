# Deployment

The app is a standard Next.js 16 app. It **builds with no environment variables**, but at
runtime it needs a Supabase project for auth, data, and media. Set Supabase up first using
[`supabase/SETUP.md`](./supabase/SETUP.md) (run migrations `0001`–`0003`, create the public
`birthday-media` bucket, enable Email auth).

## Environment variables (all hosts)

| Key                             | Notes                                            |
| ------------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API → Project URL  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | service_role secret — **server-only**            |
| `NEXT_PUBLIC_APP_URL`           | the deployed origin, e.g. `https://your-app.vercel.app` (used to build share links) |

## Option A — Vercel (recommended)

1. Push the repo to GitHub (or import the folder).
2. On [vercel.com](https://vercel.com) → **New Project** → import the repo. Next.js is
   auto-detected; no build config needed (`next build`).
3. Under **Settings → Environment Variables**, add all four keys above.
4. Deploy. Then set `NEXT_PUBLIC_APP_URL` to the real deployed URL and **redeploy** so
   share links use the correct origin.
5. (Optional) Add a custom domain in **Settings → Domains**; SSL is automatic. Update
   `NEXT_PUBLIC_APP_URL` again if you do.

## Option B — Copy-the-folder deploy

This repo is developed to be portable (see `SPEC_PATCHES.md`). To move it to another
machine / server:

1. Copy the project folder **without** `node_modules`, `.next`, and `.git`
   (use `npm run zip`, which produces a clean archive — see below).
2. On the target: `npm install`, create a real `.env.local` (see the table above), then
   `npm run build` and `npm start` (defaults to port 3000).
3. Put it behind a reverse proxy / process manager as you prefer.

> `npm run zip` creates `../birthday-experience-generator.zip` excluding
> `node_modules`, `.next`, and `.git`, keeping everything else (including source,
> `supabase/`, and docs).

## CI

`.github/workflows/ci.yml` runs `npm run verify` (lint + typecheck + build) on every push
to `main` and on PRs. It needs no secrets because the build is keyless.

## Pre-deploy checklist

- [ ] `npm run verify` passes locally.
- [ ] Supabase migrations `0001`–`0003` run; `birthday-media` bucket is public; Email auth on.
- [ ] All four env vars set on the host (service-role key kept server-side).
- [ ] `NEXT_PUBLIC_APP_URL` matches the real deployed origin.
- [ ] Open a published `/b/[slug]` in an incognito window to confirm the public experience renders.
