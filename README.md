# 🎂 Birthday Experience Generator

Build a personalized, cinematic birthday website for someone special — photos, music, a
video message, an interactive cake they blow out with their microphone, fireworks, and a
final heartfelt message — then share it as a single public link.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Framer
Motion · Supabase**.

> **Stack note:** this project was scaffolded on a newer stack than the original spec
> assumed (Next 14 / React 18 / Tailwind 3). Every deliberate divergence is documented in
> [`SPEC_PATCHES.md`](./SPEC_PATCHES.md), which is authoritative wherever the spec and the
> installed stack disagree.

---

## Prerequisites

- Node.js 18.18+ (or 20+)
- A free [Supabase](https://supabase.com) project

## 1. Install

```bash
npm install
```

## 2. Set up Supabase

Follow [`supabase/SETUP.md`](./supabase/SETUP.md) step by step. In short:

1. Create a Supabase project.
2. Run [`supabase/migrations/0001_schema.sql`](./supabase/migrations/0001_schema.sql) in
   the SQL Editor (tables, indexes, RLS policies).
3. Create a **public** Storage bucket named exactly `birthday-media` (200 MB file limit).
4. Run [`supabase/migrations/0002_storage_policies.sql`](./supabase/migrations/0002_storage_policies.sql).
5. Under **Authentication → Providers**, enable **Email** and turn **Confirm email OFF**
   (MVP skips email confirmation).

## 3. Environment variables

Copy the template and fill in your project's values (Supabase → Project Settings → API):

```bash
cp .env.example .env.local
```

| Key                             | Where to find it                         |
| ------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project Settings → API → Project URL     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Project Settings → API → service_role ⚠️ server-only, never commit |
| `NEXT_PUBLIC_APP_URL`           | `http://localhost:3000` locally          |

> A `.env.local` with **placeholder** values is checked into the working tree so the app
> boots, but auth and data operations fail until you replace them with real keys.

## 4. Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build (must pass clean)
npm run lint     # ESLint (must pass clean)
```

---

## How it works

### Creator side (login required)

- `/signup`, `/login` — Supabase email/password auth.
- `/dashboard` — list, create, and delete birthday projects.
- `/editor/[id]` — split-pane editor: recipient name, theme, messages, font, photo /
  music / video uploads, drag-to-reorder photos, publish toggle, and a live preview
  iframe. Text fields auto-save on blur.
- `/editor/[id]/preview` — owner-only live preview of the experience.

### Recipient side (no login)

- `/b/[slug]` — the cinematic experience. Scene order: **tap-to-start → welcome →
  slideshow → message → video (if any) → cake → fireworks → finale**.
- The cake scene uses the **Web Audio API** to detect blowing into the microphone; if the
  mic is denied or unsupported, a tap-to-extinguish fallback appears.

### Security model

- Creator routes (`/dashboard`, `/editor/*`) are gated by [`proxy.ts`](./proxy.ts)
  (Next 16's renamed middleware).
- **Row Level Security** does the real enforcement: creators only read/write their own
  rows; the public can only read rows with `status = 'published'`.
- The service-role key is used **only** in `/api/*` route handlers, never in the browser.

---

## Project layout

```
app/                 routes (auth, dashboard, editor, /b/[slug], api/*)
components/editor/    creator-side editor widgets
components/experience/ recipient-side cinematic scenes
components/ui/        shared primitives (Button, Input, Card, Spinner, ProgressDots)
lib/supabase/         browser / server / admin clients
lib/hooks/            useMicrophone, useAudio, useExperienceState, useUpload
lib/utils/            themes, slugGenerator, uploadHelpers, cn
types/index.ts        all shared TypeScript types
supabase/             SQL migrations + setup checklist
proxy.ts              auth protection (formerly middleware.ts)
```

## Deploy (Vercel)

1. Push to GitHub and import the repo at [vercel.com](https://vercel.com) (Next.js is
   auto-detected).
2. Add the four environment variables under **Settings → Environment Variables**.
3. Deploy, then update `NEXT_PUBLIC_APP_URL` to the deployed URL and redeploy so shareable
   links use the right origin.

---

## Status

The full MVP (spec Days 1–20) is implemented and passes `npm run build` and `npm run lint`
clean. Remaining before "done" per the spec's acceptance criteria: connect a real Supabase
project, run end-to-end + RLS verification, mobile-device QA (iPhone 14 Pro / Pixel 7),
a real-device microphone test, and the Vercel deploy.
