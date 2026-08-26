PrepVerse DB schema

This folder contains the initial SQL schema for PrepVerse LLM and instructions to apply it to your Supabase/Postgres instance.

Files:
- schema.sql — core tables for users/profiles, exams/subjects/topics, questions, options, tests, attempts, answers, AI traces, admin logs, etc.

How to apply (Supabase web UI):
1. Open https://app.supabase.com and go to your project.
2. In the left menu select "SQL Editor".
3. Create a new query, paste the contents of db/schema.sql, and run it.

How to apply (psql / CLI):
1. Install psql or use Supabase CLI.
2. Export connection string or get connection details from Supabase (Settings → Database → Connection info).
3. Example:
   psql "postgresql://<db_user>:<db_pass>@<db_host>:5432/<db_name>?sslmode=require" -f db/schema.sql

Notes:
- The schema uses gen_random_uuid() from the pgcrypto extension — ensure your DB allows extensions (Supabase supports this by default).
- The schema seeds a demo admin profile with email admin@prepverse.local (only for dev). Do NOT use this in production.
- The schema intentionally keeps an 'auth_user_id' field on profiles to map Supabase auth users to app profiles. When a user signs up via Supabase Auth, create or sync a profiles row.

Next steps (Phase 1 -> Authentication):
1. Update .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
2. In Supabase, enable Email sign-in (Auth → Settings) and configure OAuth providers (Auth → Settings → External OAuth Providers) for Google as desired.
   - Add redirect URL: http://localhost:3000
3. Start the dev server: npm run dev
4. Sign up via the app; then create/sync the profiles row in the database for that user (server or client-side code can call an API route that upserts the profile).

If you want, I can:
- Create migration scripts or a seed script to create default exams/subjects/topics
- Implement the upstream profile sync (create profile on sign-up)
- Add Google OAuth sign-in flow in the Sign-In page

Tell me which of the above you want next and I’ll implement it.