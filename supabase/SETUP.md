# Supabase setup checklist (Day 2 — manual dashboard steps)

The SQL in `migrations/` is committed here so it survives in git, but Supabase
itself is configured by hand in the dashboard. Do these once, in order:

1. Go to [supabase.com](https://supabase.com) → **New project**.
   Pick a region close to your users. Save the database password in a password manager.
2. Once provisioned, open **Project Settings → API** and copy into `.env.local`
   (create it from `.env.example`):
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role secret → `SUPABASE_SERVICE_ROLE_KEY`
3. Open **SQL Editor** → paste and run `migrations/0001_schema.sql`.
4. Open **Storage** → **New bucket** named exactly `birthday-media`:
   - Public access: **ON**
   - File size limit: **200 MB** (videos)
5. Back in **SQL Editor** → run the remaining migrations **in order**:
   `migrations/0002_storage_policies.sql`, then `migrations/0003_custom_theme.sql`
   (adds the `custom_theme` column for the Custom theme builder). Run every numbered
   file in `migrations/` so the schema is complete.
6. Open **Authentication → Providers**:
   - Enable **Email**.
   - Turn **Confirm email OFF** (spec Section 10.1 — MVP skips confirmation).
   - (Optional) enable Google OAuth.

## Verifying (spec Section 0 — do not skip)

After Day 4 (auth pages) exists, confirm RLS actually blocks unauthorized access:

- As an anonymous client, `select * from birthday_projects` must return only
  `status = 'published'` rows (none yet).
- As user A, you must not be able to read user B's draft projects.
