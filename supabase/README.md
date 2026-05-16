# Supabase Setup

This project uses Supabase for authentication and as the source of truth for
portfolio data.

## One-time setup

1. Create a project at https://supabase.com/dashboard.
2. Copy the project's URL, publishable key, and service role key into
   `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key — server only>
   ```
3. Apply the migrations in order using the SQL Editor in the Supabase dashboard
   (or `supabase db push` if you have the Supabase CLI installed):
   - `migrations/0001_initial_schema.sql`
   - `migrations/0002_rls_policies.sql`
4. Regenerate `src/lib/supabase/database.types.ts`:
   ```
   npx supabase gen types typescript --project-id <your-project-id> --schema public > src/lib/supabase/database.types.ts
   ```
   The committed version was hand-written to match the schema — regenerating
   keeps it in sync if you change tables.

## Auth providers

The MVP uses email/password (PRD §18.0.1). Optional magic link can be enabled
in the Authentication → Providers settings of the Supabase dashboard.

## Verifying RLS

After applying the policies, log in as user A in one browser and user B in
another (private window). Confirm that `select * from public.portfolios` from
the SQL editor as the `anon` role returns zero rows, and that user A cannot
see user B's portfolio rows.
