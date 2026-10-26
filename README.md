# 🎂 Birthday Experience Generator

Build a personalized, cinematic birthday website for someone special — photos, music, a
video message, friends' wishes, an interactive cake they blow out with their microphone,
fireworks, and a final heartfelt message — then share it as a single public link.

Live: **https://birthday-experience-generator.vercel.app**

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Framer
Motion · Supabase**.

> **Stack note:** this project was scaffolded on a newer stack than the original spec
> assumed (Next 14 / React 18 / Tailwind 3). Every deliberate divergence is documented in
> [`SPEC_PATCHES.md`](./SPEC_PATCHES.md), which is authoritative wherever the spec and the
> installed stack disagree.

---

## Features

**For the creator**

- Email/password accounts with password reset and optional email confirmation.
- Dashboard of your cards, with view counts and an "opens on" badge for scheduled cards.
- Editor with autosave, live phone preview, 7 themes (or a full custom builder with
  colors, background photo and drag-placed stickers), and 3 message fonts.
- Photos with captions (drag or arrow-button reordering, works on touch), background
  music, and a video message — each removable/replaceable.
- **Friends' wishes:** share an invite link (`/wish/<id>`); friends leave a short message
  without an account, you moderate them, and they play as their own scene.
- **Scheduled reveal:** pick an unlock time; until then the link shows a countdown and the
  content is withheld server-side.
- Choose how many candles go on the cake (1–10).
- One-tap sharing: native share sheet, WhatsApp, email, or copy link. Link previews in
  chat apps show "Happy Birthday, {name}!" (never the private content).

**For the birthday person** (no login): tap to start → welcome → photo slideshow (tap to
skip ahead) → typewriter message (tap to show all) → wishes → video → blow out the
candles (microphone, with a tap fallback) → fireworks → finale with "Watch again".
Includes a mute button, resumes after a refresh, and respects reduced-motion settings.

## Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project

## 1. Install

```bash
npm install
```

## 2. Set up Supabase

Follow [`supabase/SETUP.md`](./supabase/SETUP.md). In short: run every file in
[`supabase/migrations/`](./supabase/migrations) **in order** (`0001` → `0004`) in the SQL
Editor, enable Email auth, and set the auth redirect URLs.

## 3. Environment variables

```bash
cp .env.example .env.local
```

| Key                             | Where to find it                         |
| ------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project Settings → API → Project URL     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Project Settings → API → service_role ⚠️ server-only, never commit |
| `NEXT_PUBLIC_APP_URL`           | `http://localhost:3000` locally          |

## 4. Run

```bash
npm run dev      # http://localhost:3000
npm run verify   # lint + typecheck + build (what CI runs)
```

End-to-end test (needs a running app with real keys — a local `supabase start` works):
`python .claude/skills/run-birthday-experience-generator/e2e.py`.

---

## How it works

### Routes

| Route | Who | What |
| ----- | --- | ---- |
| `/` | public | landing page |
| `/signup`, `/login`, `/forgot-password`, `/reset-password` | public | auth |
| `/auth/callback` | public | lands emailed auth links (confirm / reset) |
| `/dashboard`, `/editor/[id]`, `/editor/[id]/preview` | creator | gated by [`proxy.ts`](./proxy.ts) |
| `/b/[slug]` | anyone with the link | the experience (or a countdown before the reveal) |
| `/wish/[id]` | anyone with the invite | leave a wish |
| `/api/projects`, `/api/publish`, `/api/upload` | creator | data writes |
| `/api/wishes` | public | wish submission (validated, capped, honeypot) |

### Security model

See [`SECURITY.md`](./SECURITY.md). In short: Row Level Security is the real boundary;
every owner query also filters `creator_id` explicitly (RLS policies are OR'd with the
public-read policy); all writes are validated server-side; the service-role key is
server-only.

---

## Project layout

```
app/                   routes (auth, dashboard, editor, /b/[slug], /wish/[id], api/*)
components/editor/     creator-side editor widgets
components/experience/ recipient-side cinematic scenes
components/ui/         shared primitives (Button, Input, Card, AuthCard, icons…)
lib/supabase/          browser / server / admin clients
lib/data/              server-side data loading for /b/[slug]
lib/hooks/             useMicrophone, useAudio, useExperienceState, useUpload, useAutosave
lib/utils/             themes, validation, resolveTheme, uploadHelpers, …
types/index.ts         all shared TypeScript types
supabase/              SQL migrations + setup checklist
proxy.ts               auth protection + session refresh (formerly middleware.ts)
```

## Deploy

See [`DEPLOY.md`](./DEPLOY.md). Pushing to `main` deploys to Vercel automatically.
