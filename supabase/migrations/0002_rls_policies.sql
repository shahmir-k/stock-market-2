-- Row Level Security per PRD §34.9.
-- Every public table containing user data has RLS enabled and 4 policies
-- (select/insert/update/delete) gated on `user_id = auth.uid()` or
-- `id = auth.uid()` for the profiles table.

-- ===========================================================================
-- Enable RLS
-- ===========================================================================
alter table public.profiles            enable row level security;
alter table public.portfolios          enable row level security;
alter table public.holdings            enable row level security;
alter table public.transactions        enable row level security;
alter table public.portfolio_snapshots enable row level security;
alter table public.risk_warnings       enable row level security;
alter table public.learning_progress   enable row level security;

-- ===========================================================================
-- profiles — keyed on profiles.id = auth.uid()
-- ===========================================================================
create policy "profiles_select_own"
  on public.profiles for select using (id = auth.uid());
create policy "profiles_insert_own"
  on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
-- profiles delete is handled by the auth.users cascade; no explicit delete
-- policy is exposed to clients to avoid accidental deletion of the profile
-- row independently of the auth account.

-- ===========================================================================
-- portfolios
-- ===========================================================================
create policy "portfolios_select_own"
  on public.portfolios for select using (user_id = auth.uid());
create policy "portfolios_insert_own"
  on public.portfolios for insert with check (user_id = auth.uid());
create policy "portfolios_update_own"
  on public.portfolios for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "portfolios_delete_own"
  on public.portfolios for delete using (user_id = auth.uid());

-- ===========================================================================
-- holdings
-- ===========================================================================
create policy "holdings_select_own"
  on public.holdings for select using (user_id = auth.uid());
create policy "holdings_insert_own"
  on public.holdings for insert with check (user_id = auth.uid());
create policy "holdings_update_own"
  on public.holdings for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "holdings_delete_own"
  on public.holdings for delete using (user_id = auth.uid());

-- ===========================================================================
-- transactions
-- ===========================================================================
create policy "transactions_select_own"
  on public.transactions for select using (user_id = auth.uid());
create policy "transactions_insert_own"
  on public.transactions for insert with check (user_id = auth.uid());
-- Updates not exposed: transactions are append-only from client UI.
create policy "transactions_delete_own"
  on public.transactions for delete using (user_id = auth.uid());

-- ===========================================================================
-- portfolio_snapshots
-- ===========================================================================
create policy "portfolio_snapshots_select_own"
  on public.portfolio_snapshots for select using (user_id = auth.uid());
create policy "portfolio_snapshots_insert_own"
  on public.portfolio_snapshots for insert with check (user_id = auth.uid());
create policy "portfolio_snapshots_delete_own"
  on public.portfolio_snapshots for delete using (user_id = auth.uid());

-- ===========================================================================
-- risk_warnings
-- ===========================================================================
create policy "risk_warnings_select_own"
  on public.risk_warnings for select using (user_id = auth.uid());
create policy "risk_warnings_insert_own"
  on public.risk_warnings for insert with check (user_id = auth.uid());
create policy "risk_warnings_update_own"
  on public.risk_warnings for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "risk_warnings_delete_own"
  on public.risk_warnings for delete using (user_id = auth.uid());

-- ===========================================================================
-- learning_progress
-- ===========================================================================
create policy "learning_progress_select_own"
  on public.learning_progress for select using (user_id = auth.uid());
create policy "learning_progress_insert_own"
  on public.learning_progress for insert with check (user_id = auth.uid());
create policy "learning_progress_update_own"
  on public.learning_progress for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "learning_progress_delete_own"
  on public.learning_progress for delete using (user_id = auth.uid());
