-- 0003_time_travel.sql — adds back-dated trade columns per docs/plans/time-travel.md §6.

-- Holdings: track the earliest purchase date so back-dated sells can be gated.
alter table public.holdings
  add column if not exists first_purchase_date date;

-- Transactions: store the purchase (settlement) date and a time-travel flag.
alter table public.transactions
  add column if not exists purchase_date date,
  add column if not exists is_time_traveled boolean not null default false;

-- Backfill purchase_date with the existing wall-clock date so existing rows
-- continue to render in the history table.
update public.transactions
   set purchase_date = (quote_timestamp at time zone 'utc')::date
 where purchase_date is null;

-- Now require it on future inserts.
alter table public.transactions
  alter column purchase_date set not null;

-- Backfill holdings.first_purchase_date from the earliest BUY transaction
-- for that holding's portfolio + symbol.
update public.holdings h
   set first_purchase_date = sub.first_date
  from (
    select portfolio_id, symbol, min(purchase_date) as first_date
      from public.transactions
     where type = 'BUY'
     group by portfolio_id, symbol
  ) sub
 where h.portfolio_id = sub.portfolio_id
   and h.symbol = sub.symbol
   and h.first_purchase_date is null;

create index if not exists transactions_purchase_date_idx
  on public.transactions(portfolio_id, purchase_date desc);
