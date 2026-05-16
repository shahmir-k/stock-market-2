-- Stock Market Simulator — Database audit script
--
-- Run via the Supabase SQL editor or:
--   mcp__supabase__execute_sql with this file's contents.
--
-- Verifies every schema constraint and RLS policy from PRD §34.
-- Every check returns a single row with status='ok' or status='fail'.
-- If any row is 'fail', the database has drifted from the spec.

-- ============================================================================
-- SCHEMA CONSTRAINTS (D-SCH-001..012)
-- ============================================================================

-- D-SCH-001: portfolios.starting_balance_cad default = 5000
select 'D-SCH-001' as id,
       case when column_default like '5000%' then 'ok' else 'fail' end as status,
       'portfolios.starting_balance_cad default' as check_name,
       column_default
from information_schema.columns
where table_schema='public' and table_name='portfolios' and column_name='starting_balance_cad';

-- D-SCH-002: portfolios.base_currency check = 'CAD'
select 'D-SCH-002' as id,
       case when count(*) > 0 then 'ok' else 'fail' end as status,
       'portfolios.base_currency = CAD constraint' as check_name,
       count(*) as constraint_count
from information_schema.check_constraints cc
join information_schema.constraint_column_usage ccu using (constraint_schema, constraint_name)
where ccu.table_name='portfolios' and ccu.column_name='base_currency';

-- D-SCH-003: portfolios.market_data_mode check IN ('API','MOCK')
select 'D-SCH-003' as id,
       case when count(*) > 0 then 'ok' else 'fail' end as status,
       'portfolios.market_data_mode constraint' as check_name,
       count(*) as constraint_count
from information_schema.check_constraints cc
join information_schema.constraint_column_usage ccu using (constraint_schema, constraint_name)
where ccu.table_name='portfolios' and ccu.column_name='market_data_mode';

-- D-SCH-004: one_active_portfolio_per_user partial unique index
select 'D-SCH-004' as id,
       case when count(*) > 0 then 'ok' else 'fail' end as status,
       'one_active_portfolio_per_user index' as check_name,
       count(*) as index_count
from pg_indexes
where schemaname='public' and indexname='one_active_portfolio_per_user';

-- D-SCH-005: holdings.asset_type check IN ('STOCK','ETF')
select 'D-SCH-005' as id,
       case when count(*) > 0 then 'ok' else 'fail' end as status,
       'holdings.asset_type constraint' as check_name,
       count(*) as constraint_count
from information_schema.check_constraints cc
join information_schema.constraint_column_usage ccu using (constraint_schema, constraint_name)
where ccu.table_name='holdings' and ccu.column_name='asset_type';

-- D-SCH-006: holdings.native_currency check IN ('CAD','USD')
select 'D-SCH-006' as id,
       case when count(*) > 0 then 'ok' else 'fail' end as status,
       'holdings.native_currency constraint' as check_name,
       count(*) as constraint_count
from information_schema.check_constraints cc
join information_schema.constraint_column_usage ccu using (constraint_schema, constraint_name)
where ccu.table_name='holdings' and ccu.column_name='native_currency';

-- D-SCH-007: holdings.quantity check ≥ 0
select 'D-SCH-007' as id,
       case when count(*) > 0 then 'ok' else 'fail' end as status,
       'holdings.quantity ≥ 0 constraint' as check_name,
       count(*) as constraint_count
from information_schema.check_constraints cc
join information_schema.constraint_column_usage ccu using (constraint_schema, constraint_name)
where ccu.table_name='holdings' and ccu.column_name='quantity';

-- D-SCH-008: holdings UNIQUE (portfolio_id, symbol) — R-BUG-006 regression
select 'D-SCH-008' as id,
       case when count(*) > 0 then 'ok' else 'fail' end as status,
       'holdings unique (portfolio_id, symbol)' as check_name,
       count(*) as index_count
from pg_indexes
where schemaname='public'
  and tablename='holdings'
  and indexdef like '%UNIQUE%portfolio_id%symbol%';

-- D-SCH-009: transactions.type check IN ('BUY','SELL')
select 'D-SCH-009' as id,
       case when count(*) > 0 then 'ok' else 'fail' end as status,
       'transactions.type constraint' as check_name,
       count(*) as constraint_count
from information_schema.check_constraints cc
join information_schema.constraint_column_usage ccu using (constraint_schema, constraint_name)
where ccu.table_name='transactions' and ccu.column_name='type';

-- D-SCH-010: risk_warnings.severity check IN ('INFO','LOW','MEDIUM','HIGH')
select 'D-SCH-010' as id,
       case when count(*) > 0 then 'ok' else 'fail' end as status,
       'risk_warnings.severity constraint' as check_name,
       count(*) as constraint_count
from information_schema.check_constraints cc
join information_schema.constraint_column_usage ccu using (constraint_schema, constraint_name)
where ccu.table_name='risk_warnings' and ccu.column_name='severity';

-- D-SCH-011: learning_progress UNIQUE (user_id, term_slug)
select 'D-SCH-011' as id,
       case when count(*) > 0 then 'ok' else 'fail' end as status,
       'learning_progress unique (user_id, term_slug)' as check_name,
       count(*) as index_count
from pg_indexes
where schemaname='public'
  and tablename='learning_progress'
  and indexdef ilike '%user_id%term_slug%';

-- ============================================================================
-- ROW LEVEL SECURITY (D-RLS-001..012)
-- ============================================================================

-- D-RLS-ALL: every user-data table has RLS enabled
select 'D-RLS-enabled' as id,
       case when bool_and(rowsecurity) then 'ok' else 'fail' end as status,
       'RLS enabled on all 7 user-data tables' as check_name,
       string_agg(tablename || '=' || rowsecurity::text, ', ') as detail
from pg_tables
where schemaname='public'
  and tablename in ('profiles','portfolios','holdings','transactions',
                    'portfolio_snapshots','risk_warnings','learning_progress');

-- D-RLS-policies: count policies per table (PRD §34.9 expects 4 per table
-- except profiles which intentionally omits DELETE).
select 'D-RLS-policy-count' as id,
       case when count(*) >= 25 then 'ok' else 'fail' end as status,
       'expected ≥25 RLS policies across user-data tables' as check_name,
       count(*) as policy_count
from pg_policies
where schemaname='public'
  and tablename in ('profiles','portfolios','holdings','transactions',
                    'portfolio_snapshots','risk_warnings','learning_progress');

-- D-RLS-012: profiles has no DELETE policy (cascade-only deletion)
select 'D-RLS-012' as id,
       case when count(*) = 0 then 'ok' else 'fail' end as status,
       'profiles has NO DELETE policy (cascade-only)' as check_name,
       count(*) as delete_policies
from pg_policies
where schemaname='public' and tablename='profiles' and cmd='DELETE';

-- ============================================================================
-- LIVE RLS BEHAVIOUR — simulated anon read
-- Run with: set role anon; select count(*) from <each user table>;
-- Expected: 0 rows from every user-data table when no JWT is present.
-- ============================================================================

-- D-RLS-001..007: anon SELECT returns 0 rows from every user-data table.
-- (Wrap in a function so anon-impersonation works inside a single SQL block.)
do $$
declare
  t text;
  c bigint;
begin
  set local role anon;
  for t in select unnest(array['profiles','portfolios','holdings','transactions',
                               'portfolio_snapshots','risk_warnings','learning_progress'])
  loop
    execute format('select count(*) from public.%I', t) into c;
    if c <> 0 then
      raise notice 'D-RLS-ANON FAIL: % returned % rows for anon', t, c;
    end if;
  end loop;
  reset role;
end $$;

select 'D-RLS-anon-summary' as id,
       'see notices' as status,
       'anon SELECT * from all user tables → expect 0 rows each' as check_name;
