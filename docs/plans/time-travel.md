# Time-Travel Buy/Sell — Development & Design Plan

Status: **Ready to implement** — all design decisions are resolved.
Owner: TBD. Self-contained: an implementing agent should not need to ask further questions.

---

## 1. Feature in one paragraph

On the asset detail page (`/asset/[symbol]`), the `TradeTicket` gains a **purchase-date slider** that lets the user pick any past date inside the asset's available price history. When the user previews/confirms the trade, the trade executes at the **historical close** on that date (converted to CAD using the **historical USD→CAD** rate on that same date). Cash is deducted at the historical price. The holding then tracks to **today's live price**, so unrealized gain reflects the full historical-to-today multiplier — the educational story is "what would my $1,000 of AAPL in 2010 be worth today?" The slider applies to both BUY and SELL; SELL must be on or after the holding's first-purchase date. Granularity is per-day. When the slider is at "Today", behavior is identical to the current implementation (no regressions).

---

## 2. Goals & non-goals

### Goals

- Asset detail TradeTicket gets a per-day, full-history slider plus a YYYY-MM-DD readout/input and a "Today" reset.
- BUY executes at historical close + historical FX; resulting holding is valued at today's live price.
- SELL executes at historical close + historical FX; sell date must be ≥ the holding's `firstPurchaseDate`.
- Per-symbol slider bounds are derived from the asset's actual history (earliest available point → today).
- Mock-mode supports ~10 years of synthetic history and date-aware mock FX so the feature is fully exercisable offline.
- Existing trades (slider at "Today") behave identically to today — no regressions in current tests.
- Transactions are tagged with `purchaseDate` and `isTimeTraveled` so the history table and any future analytics can distinguish back-dated trades.

### Non-goals (explicitly out of scope — do not implement)

- No per-lot FIFO tracking. Holdings remain weighted-average cost. A back-dated sell that predates a *later* buy is permitted; this is a documented simplification.
- No back-fill of `portfolio_snapshots`. The portfolio value chart still starts at account creation; it does not retroactively grow from a 2010 buy date. (This matches the chosen "value at today" semantics.)
- No time-travel on `/compound-growth` (Backtest tool already covers that use case and stays as-is).
- No dividends, no splits, no fees. Same as today.
- No new asset types, exchanges, or currencies.

---

## 3. UX specification

### 3.1 Placement

The slider lives inside `TradeTicket` (`src/components/trading/TradeTicket.tsx`), above the Quantity input. It is visible on both the BUY and SELL tabs.

### 3.2 Layout (desktop, ≥ md)

```
┌──────────────────────────────────────────┐
│ Buy   Sell                               │  ← existing mode tabs
│ ──────────                               │
│                                          │
│ PURCHASE DATE                  [ Today ] │  ← eyebrow + reset button
│ 2010-01-04                               │  ← editable date input
│ ┌──────────────────────────────────────┐ │
│ │ ●──────────────────────────────────  │ │  ← <input type="range">
│ └──────────────────────────────────────┘ │
│  2010    2015    2020    2025   TODAY    │  ← year tick labels
│                                          │
│ Price on that date  $7.64 USD            │  ← read-only chips
│ FX on that date     1.04 → ≈ $7.94 CAD   │
│                                          │
│ QUANTITY                                 │
│ 0                                        │
│                                          │
│ Estimated total      —                   │
│ Cash after           —                   │
│                                          │
│ [ Preview Buy → ]                        │
└──────────────────────────────────────────┘
```

### 3.3 Component behavior

- **Slider track**: full asset history (earliest available point → today). Step = 1 day. Year ticks are static labels (decade-spanning history may show every-2-years).
- **Date readout / editor**: native `<input type="date">` with `min` = earliest history date, `max` = today. Typing a valid date jumps the slider; dragging the slider updates the input. Out-of-range dates snap to the bound.
- **Today button**: resets to today's date and visually de-emphasizes the slider (e.g., subtle muted track) to signal "this is a present-day trade." This MUST be the default state on first render.
- **Live preview chips** ("Price on that date" / "FX on that date"): debounce 200 ms while dragging, fetch historical close + historical FX, show the result. Show a small spinner while fetching, "—" when no data.
- **Loading bounds**: while the asset's earliest available date is being fetched, the slider shows a disabled skeleton state with copy "Loading available range…". This fetch happens once per asset symbol load.
- **Sell-tab guard**: if user is on SELL and tries a date earlier than `holding.firstPurchaseDate`, the slider visually clamps and an inline message reads: "You didn't own {symbol} before {firstPurchaseDate}." The Preview button is disabled.
- **Out-of-data dates**: if `historyAt(symbol, date)` returns no point (weekend/holiday/missing), we **fall back to the next available trading day backward** (most recent close ≤ chosen date) and surface a small note: "Used close of {actualDate} (markets closed)."
- **A11y**: slider has `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext="January 4, 2010"`. Keyboard: Left/Right ±1 day, PageUp/Down ±30 days, Home/End jump to bounds. Date input is properly labelled.

### 3.4 Confirmation modal

`TradeConfirmationModal` (`src/components/trading/TradeConfirmationModal.tsx`) shows the time-traveled date prominently when `preview.purchaseDate !== today`:

```
Confirm purchase                            ×
─────────────────────────────────────────────
Buy 100 AAPL                          Time-traveled
on Jan 4, 2010
at $7.64 USD  ·  FX 1.04  ·  $7.94 CAD each
─────────────────────────────────────────────
Total cost            $794.00 CAD
Cash after            $4,206.00 CAD
─────────────────────────────────────────────
[ Cancel ]                [ Confirm ]
```

### 3.5 Transactions table & holdings row

- `TransactionHistoryTable` (`src/components/portfolio/TransactionHistoryTable.tsx`): add a "Time-traveled" badge to rows where `transaction.isTimeTraveled === true`. Show the **purchase date** (not the wall-clock `timestamp`) as the row's primary date. Add a small "·" subtitle with the wall-clock so it's still visible.
- `HoldingsTable` (`src/components/portfolio/HoldingsTable.tsx`): add a "First bought" column showing `holding.firstPurchaseDate` (formatted as `Mon DD, YYYY`). Existing holdings created before this migration display `—`.

### 3.6 Empty / error / freshness states

- Earliest date fetch fails → slider disabled, copy: "Couldn't load this asset's price history. Try again." with a Retry button.
- Historical close fetch returns no data → preview chip shows "—", and `Preview Buy →` button is disabled with the inline message "No price data on that date."
- API mode rate-limited → re-use the existing `RATE_LIMITED` → friendly toast; slider stays clickable.
- Mock mode: same UX, only the data source changes.

---

## 4. Architecture overview

### 4.1 Data flow

```
User drags slider (date D)
        │
        ▼
TradeTicket → store.getHistoricalQuoteAt(symbol, D)
                │
                ▼
        marketDataProvider.getHistoricalQuoteAt(symbol, D)
                │
                ├── API mode → /api/market/history?symbol=…&start_date=D&end_date=D
                │
                └── MOCK mode → mockHistoricalQuote(symbol, D)

Same path for FX:
store.getHistoricalFxAt('USD','CAD',D)
        │
        ▼
provider.getHistoricalExchangeRate('USD','CAD',D)
        ├── API → /api/market/fx?from=USD&to=CAD&date=D
        └── MOCK → mockHistoricalFx('USD','CAD',D)
```

### 4.2 Module boundary discipline

- **Pure** (`src/lib/trading/buy.ts`, `sell.ts`, `apply.ts`): receive a historical `quote` + `fxRate` + `purchaseDate` as inputs. They do NOT fetch anything. New `purchaseDate` and `isTimeTraveled` are computed by the caller and threaded through `TradePreview` → `Transaction`.
- **Provider** (`src/lib/market-data/`): owns "how do I get a quote/FX for a past date." New methods extend the existing `MarketDataProvider` interface.
- **Store** (`src/store/simulatorStore.ts`): orchestrates: take the user's `purchaseDate`, fetch historical price + FX from the provider, build the preview via the pure modules, return it.
- **UI** (`src/components/trading/TradeTicket.tsx` + new `HistoricalDateSlider.tsx`): owns slider state and debounced preview-chip fetches. Calls store actions only.

This mirrors the existing trade pipeline; nothing inverts.

---

## 5. Type changes (`src/types/market.ts`, `src/types/portfolio.ts`, `src/types/trading.ts`)

### 5.1 `src/types/market.ts`

```ts
// NEW — emitted by /api/market/history when called with start_date=end_date=D,
// flattened to a single point for convenience.
export type HistoricalQuoteResponseData = {
  symbol: string;
  date: string;            // YYYY-MM-DD requested
  actualDate: string;      // YYYY-MM-DD of the bar we resolved to (≤ date)
  closeNative: number;
  openNative: number;
  highNative: number;
  lowNative: number;
  currency: Currency;
};
export type HistoricalQuoteResponse = ApiResponse<HistoricalQuoteResponseData>;

// NEW — slider bounds derived once per asset.
export type HistoryRangeResponseData = {
  symbol: string;
  earliestDate: string;    // YYYY-MM-DD
  latestDate: string;      // YYYY-MM-DD (today or last trading day)
};
export type HistoryRangeResponse = ApiResponse<HistoryRangeResponseData>;

// EXTEND — FxResponseData gains optional `date` for historical lookups.
// Existing call sites that don't pass a date get today's rate (unchanged).
export type FxResponseData = {
  from: 'USD' | 'CAD';
  to: 'CAD';
  rate: number;
  timestamp: string;
  date?: string;           // NEW — populated when a historical date was requested
  freshness: Freshness;
};
```

### 5.2 `src/types/portfolio.ts`

```ts
// EXTEND Holding — adds first-purchase date, used to gate back-dated sells.
export type Holding = {
  // …existing fields…
  firstPurchaseDate?: string;  // ISO date string. Optional for backwards compat;
                               // existing rows without this value behave as "no gating".
};

// EXTEND Transaction — adds purchaseDate and isTimeTraveled.
export type Transaction = {
  // …existing fields…
  purchaseDate: string;        // ISO date (YYYY-MM-DD). Equals timestamp's date
                               // when the trade was at "today". REQUIRED for new
                               // transactions. Migration backfills with date(created_at).
  isTimeTraveled: boolean;     // True iff purchaseDate !== today (when created).
};
```

### 5.3 `src/types/trading.ts`

```ts
// EXTEND order inputs — both gain an optional purchaseDate.
export type BuyOrderInput = {
  symbol: string;
  exchange?: string;
  quantity: number;
  purchaseDate?: string;       // YYYY-MM-DD. Undefined = today.
};

export type SellOrderInput = {
  symbol: string;
  quantity: number;
  purchaseDate?: string;       // YYYY-MM-DD. Undefined = today.
};

// EXTEND TradePreview — surface what the modal renders.
export type TradePreview = {
  // …existing fields…
  purchaseDate: string;        // ISO date (always set; equals today when not time-traveled)
  isTimeTraveled: boolean;
  fxRateDate?: string;         // ISO date of the FX rate used (== purchaseDate when historical)
  actualPriceDate?: string;    // ISO date the price came from (may be < purchaseDate if markets closed)
};
```

### 5.4 New error code in `src/types/market.ts`

Add `'BEFORE_FIRST_PURCHASE'` to the `ApiErrorCode` union if you choose to surface gating errors via the API envelope. (Not required — the validation is client-side via `TradeValidationError`. Recommended new `TradeValidationCode = 'BEFORE_FIRST_PURCHASE'` in `src/lib/trading/errors.ts` instead.)

---

## 6. Database migration

New migration: `supabase/migrations/0003_time_travel.sql`

```sql
-- 0003_time_travel.sql — adds back-dated trade columns.

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
```

Run via `mcp__supabase__apply_migration` after the agent has produced the SQL.

Also regenerate `src/lib/supabase/database.types.ts` to include the new columns (via the supabase MCP `generate_typescript_types` tool, scoped to this project).

---

## 7. Server API changes

### 7.1 `src/app/api/market/history/route.ts`

Already accepts `start_date` + `end_date`. No code change required for fetching a single past day — callers pass `start_date=end_date=YYYY-MM-DD`. The existing cache key already varies on the range.

**Add a new convenience endpoint** for the slider bounds:

`src/app/api/market/history/range/route.ts` (new file)

```ts
// Returns { earliestDate, latestDate } for a symbol. Implemented by asking
// Twelve Data for outputsize=5000 at 1day interval and returning the bookend
// timestamps. Cached aggressively (24h) because the earliest date is stable.

import { NextRequest } from 'next/server';

import { apiError, apiOk } from '@/lib/market-data/api/envelope';
import { CACHE_TTL, getCached, setCached } from '@/lib/market-data/cache';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';
import { normalizeHistory, type TdHistoryResponse } from '@/lib/market-data/twelveData/normalize';
import type { HistoryRangeResponseData } from '@/types/market';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.trim();
  if (!symbol) return apiError('MISSING_QUERY', 'Missing symbol parameter.');

  const cacheKey = `history-range:${symbol}`;
  const cached = getCached<HistoryRangeResponseData>(cacheKey);
  if (cached) return apiOk(cached, { cached: true });

  const result = await twelveDataFetch<TdHistoryResponse>('time_series', {
    symbol, interval: '1day', outputsize: 5000,
  });
  if (!result.ok) return apiError(result.code, result.message, result.details);

  const points = normalizeHistory(result.data);
  if (points.length === 0) {
    return apiError('HISTORY_UNAVAILABLE', 'No history for this symbol.');
  }
  const data: HistoryRangeResponseData = {
    symbol,
    earliestDate: points[0].timestamp.slice(0, 10),
    latestDate: points[points.length - 1].timestamp.slice(0, 10),
  };
  setCached(cacheKey, data, CACHE_TTL.HISTORY_RANGE_MS); // add 24h TTL to cache.ts
  return apiOk(data);
}
```

Add `HISTORY_RANGE_MS: 24 * 60 * 60 * 1000` to the `CACHE_TTL` constant in `src/lib/market-data/cache.ts`.

### 7.2 `src/app/api/market/fx/route.ts`

Extend to accept an optional `date=YYYY-MM-DD` parameter. When present, hit Twelve Data's `time_series` endpoint with `symbol=USD/CAD&interval=1day&start_date=DATE&end_date=DATE` and return the closing rate. Falls back to the nearest preceding trading day if exact date is missing. Cache key becomes `fx:USD:CAD:DATE`. TTL = 7 days (historical FX is immutable).

```ts
// Inside the existing GET handler, after the from/to validation:
const date = req.nextUrl.searchParams.get('date')?.trim();
if (date) {
  const cacheKey = `fx:${from}:${to}:${date}`;
  const cached = getCached<FxResponseData>(cacheKey);
  if (cached) return apiOk(cached, { cached: true });

  const result = await twelveDataFetch<TdHistoryResponse>('time_series', {
    symbol: `${from}/${to}`,
    interval: '1day',
    start_date: date,
    end_date: date,
    outputsize: 5,
  });
  if (!result.ok) return apiError(result.code, result.message, result.details);

  const points = normalizeHistory(result.data);
  if (points.length === 0) {
    return apiError('FX_UNAVAILABLE', 'No FX rate available for that date.');
  }
  const point = points[points.length - 1]; // last (most recent ≤ requested)
  const data: FxResponseData = {
    from: 'USD', to: 'CAD',
    rate: point.closeNative,
    timestamp: point.timestamp,
    date: point.timestamp.slice(0, 10),
    freshness: 'FRESH', // historical bars are always "FRESH" for our purposes
  };
  setCached(cacheKey, data, CACHE_TTL.FX_HISTORICAL_MS); // add 7d TTL to cache.ts
  return apiOk(data);
}
// (existing today-rate path follows unchanged)
```

Add `FX_HISTORICAL_MS: 7 * 24 * 60 * 60 * 1000` to `CACHE_TTL`.

---

## 8. Provider interface (`src/lib/market-data/provider.ts`)

Extend `MarketDataProvider`:

```ts
export interface MarketDataProvider {
  // …existing methods…
  getHistoricalQuoteAt(symbol: string, date: string): Promise<HistoricalQuoteResponseData | null>;
  getHistoricalExchangeRate(from: string, to: string, date: string): Promise<FxResponseData | null>;
  getHistoryRange(symbol: string): Promise<HistoryRangeResponseData | null>;
}
```

Implement on **both** providers:

### 8.1 `src/lib/market-data/twelveDataProvider.ts`

```ts
async getHistoricalQuoteAt(symbol, date) {
  const r = await call<HistoricalPriceResponseData>(
    `/api/market/history?symbol=${encodeURIComponent(symbol)}&interval=1day&start_date=${date}&end_date=${date}`,
  );
  if (!r.ok || !r.data.points.length) return null;
  const last = r.data.points[r.data.points.length - 1];
  // Resolve currency from a side quote (cheap; cached) OR include it via /quote endpoint.
  // Simpler: piggy-back on the existing /api/market/quote when we have it cached.
  // Sufficient: the calling store already has the live quote in hand for the same symbol.
  return {
    symbol,
    date,
    actualDate: last.timestamp.slice(0, 10),
    closeNative: last.closeNative,
    openNative: last.openNative,
    highNative: last.highNative,
    lowNative: last.lowNative,
    currency: 'USD', // caller overrides from the live quote's currency
  };
},

async getHistoricalExchangeRate(from, to, date) {
  const r = await call<FxResponseData>(
    `/api/market/fx?from=${from}&to=${to}&date=${date}`,
  );
  return r.ok ? r.data : null;
},

async getHistoryRange(symbol) {
  const r = await call<HistoryRangeResponseData>(
    `/api/market/history/range?symbol=${encodeURIComponent(symbol)}`,
  );
  return r.ok ? r.data : null;
},
```

### 8.2 `src/lib/market-data/mock/mockProvider.ts`

Add equivalent mock implementations (see §9).

---

## 9. Mock data extensions (`src/lib/market-data/mock/mockAssets.ts` + `mockProvider.ts`)

### 9.1 Extend `mockHistory` to ~10 years

Current implementation generates ~30 points walking backward from today. Refactor:

```ts
// New: optional date-aware overload. Backwards-compatible.
export function mockHistory(symbol: string, outputsize?: number, opts?: {
  startDate?: string;  // inclusive
  endDate?: string;    // inclusive
}): HistoricalPricePoint[] | null
```

Internally:
- Always pre-generate **3,652 days (~10 years)** of synthetic daily points per asset, lazily memoized per symbol.
- If `opts` provided, filter the full series by date range.
- Otherwise return the most recent `outputsize` points.
- The series is still deterministic (mulberry32 seeded by symbol hash).

### 9.2 `mockHistoricalQuote(symbol, date)`

```ts
export function mockHistoricalQuote(symbol: string, date: string): HistoricalQuoteResponseData | null {
  const asset = ASSET_BY_SYMBOL.get(symbol.toUpperCase());
  if (!asset) return null;
  const series = mockHistory(symbol, undefined, { startDate: EPOCH, endDate: date });
  if (!series || series.length === 0) return null;
  const last = series[series.length - 1]; // most recent ≤ requested date
  return {
    symbol: asset.symbol,
    date,
    actualDate: last.timestamp.slice(0, 10),
    closeNative: last.closeNative,
    openNative: last.openNative,
    highNative: last.highNative,
    lowNative: last.lowNative,
    currency: asset.currency,
  };
}
```

### 9.3 `mockHistoricalFx(from, to, date)`

Deterministic walk around `MOCK_FX_USD_CAD = 1.37` with bounded ±5% drift seeded by `hash(date)`. Returns FxResponseData with `date` populated and `freshness: 'FRESH'`. For CAD→CAD short-circuit returns rate 1.

### 9.4 `mockHistoryRange(symbol)`

Returns `{ symbol, earliestDate, latestDate }` where `earliestDate` is `today - 10 years` and `latestDate` is `today`.

### 9.5 Wire onto `mockMarketDataProvider`

Add `getHistoricalQuoteAt`, `getHistoricalExchangeRate`, `getHistoryRange` methods mapping to the new builders.

---

## 10. Pure trade modules

### 10.1 `src/lib/trading/buy.ts` — extend `BuildBuyPreviewInput`

```ts
export type BuildBuyPreviewInput = {
  order: BuyOrderInput;
  quote: QuoteResponseData;            // unchanged — the live quote (used for currency, asset metadata)
  historicalQuote?: HistoricalQuoteResponseData;  // NEW — when present, drives priceNative
  fxRate: FxRate;
  currentCashCad: number;
  warnings?: RiskWarning[];
};
```

Inside `buildBuyPreview`:

```ts
const isTimeTraveled = Boolean(input.historicalQuote);
const priceNative = input.historicalQuote?.closeNative ?? input.quote.priceNative;
const purchaseDate =
  input.historicalQuote?.date
  ?? input.order.purchaseDate
  ?? new Date().toISOString().slice(0, 10);
const actualPriceDate = input.historicalQuote?.actualDate;

// (validation now uses priceNative instead of quote.priceNative)
// (the produced TradePreview includes purchaseDate, isTimeTraveled, fxRateDate, actualPriceDate)
```

### 10.2 `src/lib/trading/sell.ts` — same pattern + first-purchase gating

```ts
export type BuildSellPreviewInput = {
  // …existing fields…
  historicalQuote?: HistoricalQuoteResponseData;
};
```

Add a new validation branch before the existing ones:

```ts
if (input.order.purchaseDate && holding.firstPurchaseDate
    && input.order.purchaseDate < holding.firstPurchaseDate) {
  throw new TradeValidationError(
    'BEFORE_FIRST_PURCHASE',
    `You didn't own ${holding.symbol} before ${holding.firstPurchaseDate}.`,
  );
}
```

Add `'BEFORE_FIRST_PURCHASE'` to the `TradeValidationCode` union in `src/lib/trading/errors.ts`.

### 10.3 `src/lib/trading/apply.ts`

In `applyBuy`:

- When **creating** a new holding (`existing` is falsy), set `firstPurchaseDate = preview.purchaseDate`.
- When updating an existing holding, **never overwrite** `firstPurchaseDate` (only ever move *earlier*, and only if `preview.purchaseDate < existing.firstPurchaseDate`). This protects the gate from being raised by a later same-symbol back-dated buy that is earlier than the existing recorded first date — that *is* a legitimate earlier purchase. Implement:
  ```ts
  const nextFirstPurchaseDate =
    existing.firstPurchaseDate && existing.firstPurchaseDate <= preview.purchaseDate
      ? existing.firstPurchaseDate
      : preview.purchaseDate;
  ```
- Both `applyBuy` and `applySell` thread `purchaseDate` and `isTimeTraveled` from `preview` into the new `Transaction`.

The Transaction `timestamp` continues to be wall-clock now; the new `purchaseDate` is the settlement date. The `quoteTimestamp` becomes the historical bar's timestamp (the `actualDate`'s ISO).

---

## 11. Store changes (`src/store/simulatorStore.ts`)

### 11.1 New action signatures

```ts
type SimulatorStoreActions = {
  // …existing actions…
  getHistoricalQuoteAt(symbol: string, date: string): Promise<HistoricalQuoteResponseData>;
  getHistoricalFxAt(from: 'USD', to: 'CAD', date: string): Promise<FxResponseData>;
  getHistoryRange(symbol: string): Promise<HistoryRangeResponseData>;
};
```

### 11.2 `previewBuy` / `previewSell`

When `order.purchaseDate` is present **and** not equal to today:

```ts
const historicalQuote = await provider.getHistoricalQuoteAt(order.symbol, order.purchaseDate);
if (!historicalQuote) {
  throw new TradeValidationError('NO_QUOTE', 'No price data on that date.');
}
// Get historical FX if asset is USD
let fxRate: number;
if (liveQuote.currency === 'CAD') {
  fxRate = 1;
} else {
  const historicalFx = await provider.getHistoricalExchangeRate('USD', 'CAD', order.purchaseDate);
  if (!historicalFx) {
    throw new TradeValidationError('UNSUPPORTED_CURRENCY', 'No FX rate for that date.');
  }
  fxRate = historicalFx.rate;
}
historicalQuote.currency = liveQuote.currency; // ensure currency matches the symbol's listing
const draft = buildBuyPreview({ order, quote: liveQuote, historicalQuote, fxRate, currentCashCad: get().portfolio.cashCad, warnings: [] });
```

When `order.purchaseDate` is absent or equals today, code path is unchanged (today's live quote + today's FX). The store MUST still set `purchaseDate = today` and `isTimeTraveled = false` on the resulting preview so downstream code never sees `undefined`.

### 11.3 No new persistence orchestration besides field passthrough

`persistAfterTrade` in `src/lib/persistence/supabaseSync.ts` writes the new columns. Update its insert payload:

```ts
{
  ...existing fields,
  purchase_date: transaction.purchaseDate,
  is_time_traveled: transaction.isTimeTraveled,
}
```

And in the same file, the holdings upsert needs `first_purchase_date: holding.firstPurchaseDate ?? null`.

### 11.4 `loadFromSupabase`

Read the new columns and surface them on the in-memory `Portfolio` / `Holding` / `Transaction` objects. Map `purchase_date` (text/date) → ISO `YYYY-MM-DD` string. Map `is_time_traveled` boolean directly.

### 11.5 `refreshHoldingQuotes` is unchanged

Today's live quote is the right value to display — holdings are valued at today's price regardless of when they were bought. No retroactive math.

### 11.6 LocalStorage persistence (`src/lib/persistence/localStorage.ts`)

- Bump the `version` constant. The persisted schema gains new optional fields.
- Add a migration step: if a loaded persisted state lacks `transaction.purchaseDate`, set it to `transaction.timestamp.slice(0, 10)` and `isTimeTraveled = false`. If `holding.firstPurchaseDate` is missing, set it to the earliest BUY transaction's `purchaseDate` for that symbol (or `undefined` if none).

---

## 12. UI components

### 12.1 New: `src/components/trading/HistoricalDateSlider.tsx`

```ts
type Props = {
  symbol: string;
  value: string;                  // YYYY-MM-DD; default = today
  earliestDate: string | null;    // bounds; null while loading
  latestDate: string;             // bounds; usually today
  minDate?: string;               // hard lower bound (e.g., holding.firstPurchaseDate for SELL)
  minDateReason?: string;         // tooltip / inline copy explaining the bound
  onChange: (date: string) => void;
  disabled?: boolean;
  loading?: boolean;
};
```

- Renders the layout in §3.2.
- Native `<input type="range" min={0} max={daysBetween(earliest,latest)} step={1}>` paired with `<input type="date">`.
- Year tick labels computed from earliest..latest span (every 5 years for >25y spans, every 2 years for 10–25y spans, every year for <10y spans).
- Internal state stays in sync via React `useEffect` when `value` changes externally.
- "Today" button calls `onChange(todayISO())`.
- Uses tokens already in `globals.css` (rule color, var(--color-accent), tabular numbers).

### 12.2 `src/components/trading/TradeTicket.tsx` — integration

State additions:

```ts
const [purchaseDate, setPurchaseDate] = useState<string>(todayISO);
const [range, setRange] = useState<HistoryRangeResponseData | null>(null);
const [rangeLoading, setRangeLoading] = useState(true);
const [historicalQuote, setHistoricalQuote] = useState<HistoricalQuoteResponseData | null>(null);
const [historicalFx, setHistoricalFx] = useState<FxResponseData | null>(null);
```

- On mount and on `symbol` change: call `store.getHistoryRange(symbol)`, populate `range`.
- On `purchaseDate` change (debounced 200ms), when `purchaseDate !== today`: call `getHistoricalQuoteAt` + `getHistoricalFxAt` (the latter only if `quote.currency === 'USD'`). Update preview chips. When `purchaseDate === today`, clear `historicalQuote`/`historicalFx`.
- `onPreview` passes `{ symbol, quantity, purchaseDate }` to `previewBuy` / `previewSell` (purchaseDate is `undefined` when it equals today, OR always set — both work).
- The displayed "Estimated total" uses `historicalQuote?.closeNative ?? quote.priceNative` and the corresponding FX rate.

Pseudo-render at the relevant section:

```tsx
<HistoricalDateSlider
  symbol={symbol}
  value={purchaseDate}
  earliestDate={range?.earliestDate ?? null}
  latestDate={range?.latestDate ?? todayISO()}
  minDate={mode === 'SELL' ? holding?.firstPurchaseDate : undefined}
  minDateReason={
    mode === 'SELL' && holding?.firstPurchaseDate
      ? `You didn't own ${symbol} before ${holding.firstPurchaseDate}.`
      : undefined
  }
  onChange={setPurchaseDate}
  loading={rangeLoading}
/>

{purchaseDate !== todayISO() && (
  <dl className="mt-3 space-y-1 text-xs">
    <div className="flex justify-between">
      <dt className="text-text-muted">Price on {purchaseDate}</dt>
      <dd className="tabular text-ink">
        {historicalQuote
          ? `${historicalQuote.closeNative.toFixed(2)} ${quote.currency}`
          : '—'}
      </dd>
    </div>
    {quote.currency === 'USD' && (
      <div className="flex justify-between">
        <dt className="text-text-muted">FX on that date</dt>
        <dd className="tabular text-ink">
          {historicalFx ? `${historicalFx.rate.toFixed(4)}` : '—'}
        </dd>
      </div>
    )}
  </dl>
)}
```

### 12.3 `src/components/trading/TradeConfirmationModal.tsx`

Add a "Time-traveled" badge near the title when `preview.isTimeTraveled`. Add a row near the price showing "Purchase date: {purchaseDate}" (formatted). No other behavior change.

### 12.4 `src/components/portfolio/TransactionHistoryTable.tsx`

- Primary date column: render `transaction.purchaseDate` formatted (e.g., `Jan 4, 2010`).
- Subtitle below: render the wall-clock `timestamp` as a small muted "logged {timeAgo}".
- Add a small badge component next to the row when `transaction.isTimeTraveled`.

### 12.5 `src/components/portfolio/HoldingsTable.tsx`

Add a "First bought" column between "Symbol" and "Quantity". Shows `holding.firstPurchaseDate` formatted, or `—`.

---

## 13. Validation & edge cases

| Scenario | Expected behavior |
|----------|------------------|
| Slider at today (default) | Identical to current TradeTicket. `purchaseDate === today`, `isTimeTraveled = false`. |
| Buy at a date before earliest history | Slider physically can't reach it (bound enforced). If user types it: input snaps to bound. |
| Buy at a weekend / holiday | Provider resolves to most recent prior trading day; `actualPriceDate < purchaseDate`. UI shows a note "Used close of {actualPriceDate}". `Transaction.purchaseDate` = the user's chosen date; `quoteTimestamp` = the actual bar's timestamp. |
| Sell before `firstPurchaseDate` | Slider clamps to `firstPurchaseDate`. Preview button disabled with inline message. |
| Sell on/after `firstPurchaseDate` but quantity > current holding | Existing "cannot sell more shares than you own" rule — unchanged. |
| API returns no price data | `previewBuy/Sell` throws `TradeValidationError('NO_QUOTE', …)`. UI shows the message inline. |
| API returns no FX for USD asset on that date | `TradeValidationError('UNSUPPORTED_CURRENCY', 'No FX rate for that date.')`. UI shows inline. |
| Existing holdings without `firstPurchaseDate` | After migration runs, all existing rows are backfilled. New code treats `firstPurchaseDate === undefined` as "no gating" (degrade gracefully). |
| User has only `cash_cad: $5,000` today and tries to buy 1M shares of $0.01 stock from 2010 | Standard cash-check rule applies against `totalCad`. If insufficient → `INSUFFICIENT_CASH`. Story: time travel doesn't grant unlimited budget — same $5k. |
| Risk warnings | Pre/post-trade warnings run unchanged. They evaluate against the post-trade portfolio at today's prices, which is the correct semantics. |
| FX rate caching across requests | Today's FX cache is separate from historical (different cache key). No cross-contamination. |
| Mode switch (API ↔ MOCK) | Range bounds re-fetched. Slider value clamps if mock's range is narrower (e.g., new asset added with shorter history). |

---

## 14. Test plan

All new tests in `tests/unit/`, `tests/integration/`, `tests/api/`, and `tests/e2e/` matching existing structure.

### 14.1 Unit (`tests/unit/`)

- `trading.test.ts` — extend:
  - `buildBuyPreview` with `historicalQuote` uses historical close, not live `quote.priceNative`.
  - `buildBuyPreview` sets `purchaseDate`, `isTimeTraveled` correctly for time-traveled and same-day cases.
  - `buildSellPreview` throws `BEFORE_FIRST_PURCHASE` when `purchaseDate < holding.firstPurchaseDate`.
  - `buildSellPreview` accepts `purchaseDate === holding.firstPurchaseDate`.
- `apply.test.ts` (new) or existing:
  - `applyBuy` sets `firstPurchaseDate` on a freshly created holding.
  - `applyBuy` keeps the earlier `firstPurchaseDate` when a later-but-still-back-dated buy lands.
  - `applyBuy` moves `firstPurchaseDate` earlier if the new buy's `purchaseDate` is older than the existing first.
  - Transactions get `purchaseDate` and `isTimeTraveled`.
- `mockHistory` (in `mockAssets.test.ts` — new if missing):
  - Returns ≥ ~2,500 points for date-range queries spanning 10y.
  - Date-range filter returns chronologically sorted points within the bounds.
  - Deterministic (same call returns same result).
- `mockHistoricalQuote`:
  - For a date in the middle of the series, returns that bar's close.
  - For a weekend, returns the most recent prior trading day.
  - For a symbol that doesn't exist, returns null.
- `mockHistoricalFx`:
  - Deterministic per (from, to, date).
  - Returns rate 1 for CAD→CAD.

### 14.2 Integration (`tests/integration/`)

- `timeTravel.test.ts` (new) — runs against the mock provider:
  - End-to-end `previewBuy({ symbol: 'AAPL', quantity: 10, purchaseDate: '2020-01-02' })`:
    - Preview uses historical close (not today's mock quote).
    - Preview includes `isTimeTraveled: true`.
    - Cash deducted equals 10 × historical close × historical FX.
  - `executeBuy` then `previewSell({ symbol, quantity: 5, purchaseDate: '2019-12-31' })` throws `BEFORE_FIRST_PURCHASE`.
  - Same `previewSell({ purchaseDate: '2022-06-01' })` succeeds.
  - After `executeBuy`, holding's `firstPurchaseDate === '2020-01-02'` (the actual price date if markets were closed).
  - After a second `executeBuy` with an even earlier `purchaseDate`, `firstPurchaseDate` moves earlier.
- `storeFlows.test.ts` — extend:
  - A trade with `purchaseDate === today` is **indistinguishable** from a trade with `purchaseDate` omitted (regression guard).

### 14.3 API route (`tests/api/`)

- `history-range.test.ts` (new) — `/api/market/history/range` returns earliest+latest from mocked Twelve Data response; caches; surfaces errors.
- `fx.test.ts` — extend: `?date=2020-01-02` calls Twelve Data with start/end date and returns the close as the rate.

### 14.4 E2E (`tests/e2e/`)

- `asset-time-travel.spec.ts` (Playwright) — runs against the dev server in MOCK mode:
  - Visit `/asset/AAPL`.
  - Slider renders with earliest ≈ today-10y.
  - Drag slider to 2018-01-02 (or any clearly-historical date).
  - Quantity = 5, click "Preview Buy →".
  - Modal shows "Time-traveled" badge and the chosen date.
  - Confirm. Navigate to `/portfolio`. Transactions table shows the row with the "Time-traveled" badge and the historical date as the primary date.
  - Holdings table shows "First bought" = the historical date.
- `asset-time-travel-sell.spec.ts`:
  - After buying AAPL on 2018-01-02, try to sell with slider at 2017-06-01.
  - Slider clamps and inline error shows.
  - Move slider to 2019-01-02. Preview Sell succeeds.

### 14.5 Regression guards

- Existing `tests/unit/trading.test.ts`, `tests/unit/portfolio.test.ts`, `tests/integration/storeFlows.test.ts` MUST still pass without modification beyond the new fields' presence.

---

## 15. File change list

### New files
- `docs/plans/time-travel.md` (this file)
- `supabase/migrations/0003_time_travel.sql`
- `src/app/api/market/history/range/route.ts`
- `src/components/trading/HistoricalDateSlider.tsx`
- `tests/unit/mockAssets.test.ts` (if missing — otherwise extend)
- `tests/integration/timeTravel.test.ts`
- `tests/api/history-range.test.ts`
- `tests/e2e/asset-time-travel.spec.ts`
- `tests/e2e/asset-time-travel-sell.spec.ts`

### Modified files
- `src/types/market.ts` — add `HistoricalQuoteResponseData`, `HistoryRangeResponseData`, extend `FxResponseData`.
- `src/types/portfolio.ts` — extend `Holding`, `Transaction`.
- `src/types/trading.ts` — extend `BuyOrderInput`, `SellOrderInput`, `TradePreview`.
- `src/lib/trading/errors.ts` — add `'BEFORE_FIRST_PURCHASE'` code.
- `src/lib/trading/buy.ts` — accept `historicalQuote`, thread `purchaseDate`/`isTimeTraveled`.
- `src/lib/trading/sell.ts` — accept `historicalQuote`, gate by `firstPurchaseDate`, thread fields.
- `src/lib/trading/apply.ts` — set/maintain `firstPurchaseDate`; persist `purchaseDate`/`isTimeTraveled` on transactions.
- `src/lib/market-data/provider.ts` — extend interface with three new methods.
- `src/lib/market-data/twelveDataProvider.ts` — implement three new methods.
- `src/lib/market-data/mock/mockProvider.ts` — implement three new methods.
- `src/lib/market-data/mock/mockAssets.ts` — 10-year history, `mockHistoricalQuote`, `mockHistoricalFx`, `mockHistoryRange`.
- `src/lib/market-data/cache.ts` — add `HISTORY_RANGE_MS` and `FX_HISTORICAL_MS` TTLs.
- `src/app/api/market/fx/route.ts` — accept optional `date` parameter.
- `src/store/simulatorStore.ts` — add three actions, extend `previewBuy`/`previewSell`.
- `src/lib/persistence/localStorage.ts` — bump version, migrate, persist new fields.
- `src/lib/persistence/supabaseSync.ts` — read/write new columns.
- `src/lib/supabase/database.types.ts` — regenerate from updated schema.
- `src/components/trading/TradeTicket.tsx` — integrate slider, fetch preview chips, pass `purchaseDate` to store actions.
- `src/components/trading/TradeConfirmationModal.tsx` — badge + purchase-date row.
- `src/components/portfolio/TransactionHistoryTable.tsx` — purchase-date as primary, badge.
- `src/components/portfolio/HoldingsTable.tsx` — "First bought" column.
- Existing tests: update fixtures so new required fields (`purchaseDate`, `isTimeTraveled`) are present.

---

## 16. Implementation order

A linear sequence that produces a passing build at every step. Each step ends with a green test run before moving on.

1. **Schema & types** — write migration, regenerate `database.types.ts`, extend TS types in `market.ts`/`portfolio.ts`/`trading.ts`. Update fixtures across existing tests to satisfy new fields. Confirm `npm test` passes.
2. **Mock data** — extend `mockHistory` to 10y, add `mockHistoricalQuote`, `mockHistoricalFx`, `mockHistoryRange`. Add `mockAssets.test.ts` cases. `npm test` passes.
3. **Provider interface** — extend `MarketDataProvider` interface; implement on mock provider first; add stubbed twelveData impls returning `null`. `npm test` passes (mock-mode tests light up).
4. **Server API** — add `/api/market/history/range/route.ts`; extend `/api/market/fx` to accept `date`. Add `tests/api/history-range.test.ts` and `tests/api/fx.test.ts` date cases. Add cache TTLs.
5. **TwelveData provider** — wire `getHistoricalQuoteAt`, `getHistoricalExchangeRate`, `getHistoryRange` to the new/extended routes.
6. **Pure trade modules** — `buy.ts`, `sell.ts`, `apply.ts` updates. Extend `tests/unit/trading.test.ts` and add `apply.test.ts` cases.
7. **Store** — add three actions, modify `previewBuy`/`previewSell`. Add `tests/integration/timeTravel.test.ts`. Update `persistAfterTrade` to write new columns.
8. **Persistence migrations** — bump localStorage version and migrate; verify `tests/unit/persistence.test.ts` covers the migration path.
9. **UI — slider component** — build `HistoricalDateSlider.tsx` in isolation with a Storybook-free smoke test (render at multiple ranges; a11y check).
10. **UI — TradeTicket integration** — add slider, debounced preview chips, "Today" reset. Manually test in `npm run dev` with `MOCK` data mode.
11. **UI — modal + tables** — badges + purchase-date column. Run E2E specs.
12. **Production smoke** — switch to API mode locally with the real `TWELVE_DATA_API_KEY`. Confirm a buy on a real historical date persists to Supabase with both new columns set, reloads correctly, and shows in the history table.

---

## 17. Acceptance criteria (what "done" looks like)

A reviewer (or PM) should be able to verify each of the following without asking implementation questions:

1. On `/asset/AAPL` in API mode, the TradeTicket shows a slider with `min` ≈ today minus the asset's history (years of data per Twelve Data) and `max` = today.
2. Dragging the slider to e.g. **2018-01-02** updates the chips: price on that date and FX on that date.
3. Clicking **Preview Buy →** with quantity 5 shows a modal with a "Time-traveled" badge, "Purchase date: Jan 2, 2018", and a total computed from the historical close × historical FX × 5.
4. Confirming the trade deducts cash equal to the modal total and creates a holding whose **First bought** column reads `Jan 2, 2018` and whose **current price** is today's live price.
5. The Transactions page shows a row with the "Time-traveled" badge, `Jan 2, 2018` as the primary date, and a muted "logged {timeAgo}" subtitle.
6. Buying the same symbol again with an earlier slider date (e.g., 2016-01-04) updates the holding's `firstPurchaseDate` to the earlier date.
7. On the SELL tab, sliding the slider before the holding's `firstPurchaseDate` clamps the slider and disables `Preview Sell →` with inline copy.
8. A sell on/after `firstPurchaseDate` succeeds and produces a transaction with the historical sell price + the chosen `purchaseDate`.
9. With the slider at "Today", a buy/sell behaves byte-identically to the current implementation. All pre-existing unit + integration tests still pass.
10. In MOCK data mode, all of the above works without any network calls. The slider's range is `today - 10y` to `today`.
11. Refresh the browser → all state (including `firstPurchaseDate` and `isTimeTraveled`) survives via Supabase + localStorage.
12. A11y: slider is keyboardable, has correct `aria-valuetext`, and the date input is labelled.

When all twelve criteria pass, the feature ships.
