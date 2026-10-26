# Supabase setup checklist

The SQL in `migrations/` is committed here so it survives in git, but Supabase
itself is configured by hand in the dashboard. Do these once, in order:

1. Go to [supabase.com](https://supabase.com) → **New project**.
   Pick a region close to your users. Save the database password in a password manager.
2. Once provisioned, open **Project Settings → API** and copy into `.env.local`
   (create it from `.env.example`):
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role secret → `SUPABASE_SERVICE_ROLE_KEY`
3. Open **SQL Editor** and run every file in `migrations/` **in order**, one at a time:
   - `0001_schema.sql` — tables, indexes, RLS policies
   - `0002_storage_policies.sql` — creates the public `birthday-media` bucket (200 MB
     limit) if missing, plus its policies
   - `0003_custom_theme.sql` — the Custom theme builder column
   - `0004_reveal_candles_wishes.sql` — scheduled reveal, candle count, friends' wishes,
     and a tighter view-tracking policy. The app runs without it (those editor controls
     stay hidden), so on an existing project you can deploy first and run this after.
4. Open **Authentication → Providers** and enable **Email**. "Confirm email" can be on
   or off — the app handles both (on is recommended for production; see `SECURITY.md`).
5. Open **Authentication → URL Configuration**:
   - **Site URL**: your deployed origin, e.g. `https://your-app.vercel.app`
   - **Redirect URLs**: add `https://your-app.vercel.app/**` and
     `http://localhost:3000/**`

   Confirmation and password-reset emails link back through `/auth/callback`; Supabase
   only redirects to URLs on this list (otherwise it falls back to the Site URL).

## Verifying

- As an anonymous client, `select * from birthday_projects` must return only
  `status = 'published'` rows.
- As user A, you must not be able to read user B's draft projects.
- Or just run `.claude/skills/run-birthday-experience-generator/e2e.py`, which checks
  both plus the rest of the flow.

## Local development database (optional)

With Docker running, `npx supabase init` in a scratch folder, copy the migrations into its
`supabase/migrations/` (renamed with a numeric timestamp prefix), then
`npx supabase start`. It prints a local URL, anon key and service-role key for
`.env.local`, and a Mailpit inbox at http://127.0.0.1:54324 that catches auth emails.
