-- Personal Stock Market Simulator MVP — Schema (PRD §34).
-- All tables live in `public`. RLS policies are in 0002_rls_policies.sql.

-- ===========================================================================
-- profiles
-- ===========================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- portfolios
-- ===========================================================================
create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Personal Portfolio',
  starting_balance_cad numeric(14,2) not null default 5000.00,
  cash_cad numeric(14,2) not null default 5000.00,
  realized_gain_loss_cad numeric(14,2) not null default 0.00,
  base_currency text not null default 'CAD',
  market_data_mode text not null default 'API',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolios_base_currency_check check (base_currency = 'CAD'),
  constraint portfolios_market_data_mode_check check (market_data_mode in ('API', 'MOCK'))
);

create unique index one_active_portfolio_per_user
  on public.portfolios(user_id)
  where is_active = true;

-- ===========================================================================
-- holdings
-- ===========================================================================
create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  asset_name text not null,
  asset_type text not null,
  exchange text,
  sector text,
  quantity numeric(20,6) not null,
  average_cost_cad numeric(14,4) not null,
  current_price_native numeric(14,4),
  current_price_cad numeric(14,4),
  native_currency text not null,
  fx_rate_to_cad numeric(14,6) not null default 1,
  last_quote_at timestamptz,
  quote_freshness text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint holdings_asset_type_check check (asset_type in ('STOCK', 'ETF')),
  constraint holdings_currency_check check (native_currency in ('CAD', 'USD')),
  constraint holdings_quantity_check check (quantity >= 0)
);

create index holdings_portfolio_id_idx on public.holdings(portfolio_id);
create index holdings_user_id_idx on public.holdings(user_id);

-- ===========================================================================
-- transactions
-- ===========================================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  symbol text not null,
  asset_name text not null,
  asset_type text not null,
  quantity numeric(20,6) not null,
  price_native numeric(14,4) not null,
  native_currency text not null,
  fx_rate_to_cad numeric(14,6) not null,
  price_cad numeric(14,4) not null,
  total_cad numeric(14,2) not null,
  realized_gain_loss_cad numeric(14,2),
  quote_timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  constraint transactions_type_check check (type in ('BUY', 'SELL')),
  constraint transactions_asset_type_check check (asset_type in ('STOCK', 'ETF')),
  constraint transactions_currency_check check (native_currency in ('CAD', 'USD'))
);

create index transactions_portfolio_id_created_at_idx
  on public.transactions(portfolio_id, created_at desc);

-- ===========================================================================
-- portfolio_snapshots
-- ===========================================================================
create table public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  total_value_cad numeric(14,2) not null,
  cash_cad numeric(14,2) not null,
  invested_value_cad numeric(14,2) not null,
  total_return_cad numeric(14,2) not null,
  total_return_percent numeric(10,4) not null,
  created_at timestamptz not null default now()
);

create index portfolio_snapshots_portfolio_id_created_at_idx
  on public.portfolio_snapshots(portfolio_id, created_at asc);

-- ===========================================================================
-- risk_warnings
-- ===========================================================================
create table public.risk_warnings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  severity text not null,
  title text not null,
  message text not null,
  related_symbol text,
  related_learning_slugs text[] not null default '{}',
  acknowledged boolean not null default false,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  constraint risk_warnings_severity_check check (severity in ('INFO', 'LOW', 'MEDIUM', 'HIGH'))
);

create index risk_warnings_portfolio_id_created_at_idx
  on public.risk_warnings(portfolio_id, created_at desc);

-- ===========================================================================
-- learning_progress
-- ===========================================================================
create table public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  term_slug text not null,
  viewed boolean not null default true,
  viewed_at timestamptz not null default now(),
  unique(user_id, term_slug)
);
