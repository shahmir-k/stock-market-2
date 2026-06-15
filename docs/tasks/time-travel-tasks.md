# Time-Travel Buy/Sell — Tasks

**Source**: `docs/plans/time-travel.md`
**Generated**: 2026-05-22
**Completed**: 2026-05-22 — all 14 tasks implemented in linear chunk order; `tsc --noEmit`, `npm run lint`, `npm test` (243/243), and `npm run build` all green.

## Overview

| Metric | Count |
|--------|------:|
| Total Tasks | 14 |
| Backend (schema/API/lib) | 8 |
| Frontend (UI) | 3 |
| Testing | 1 (dedicated E2E) — unit/integration tests are bundled into the task that adds the production code they cover |
| Foundation/Types | 2 |
| Implementation Chunks | 8 |

## Feature Summary

A per-day purchase-date slider on `TradeTicket` lets the user back-date a BUY or SELL anywhere inside the asset's available history. Trade executes at the **historical close × historical USD→CAD rate** on that date; the resulting holding is then valued at **today's live price** to expose the full historical-to-today multiplier. SELL is gated by the holding's `firstPurchaseDate`. When the slider is at "Today" behavior must be byte-identical to the current implementation (no regressions). Mock mode is extended to ~10 years of synthetic history + date-aware mock FX so the feature is exercisable offline.

**Non-goals** (do not implement): per-lot FIFO; back-fill of `portfolio_snapshots`; time-travel on `/compound-growth`; dividends/splits/fees; new asset types/exchanges/currencies.

---

## Implementation Chunks

| Chunk | Tasks | Description | Size |
|------:|-------|-------------|:----:|
| **1** | TT-001..TT-002 | Schema migration + TS types + error code + fixture updates | M |
| **2** | TT-003..TT-004 | Mock data (10y history, historical quote/FX, range) + provider interface | M |
| **3** | TT-005..TT-006 | Server API — `history/range` route + `fx?date=` extension | M |
| **4** | TT-007 | Wire real Twelve Data provider methods | S |
| **5** | TT-008 | Pure trade modules — `buy.ts`, `sell.ts` (gating), `apply.ts` (`firstPurchaseDate`) | M |
| **6** | TT-009..TT-010 | Store actions + `previewBuy/Sell` historical paths + Supabase + localStorage sync | L |
| **7** | TT-011..TT-013 | UI — `HistoricalDateSlider`, `TradeTicket` integration, modal + tables | L |
| **8** | TT-014 | E2E Playwright specs (buy + sell flows) | S |

---

## Implementation Order

### Chunk 1: Schema & Types Foundation
> TT-001 + TT-002 — Sequential. Everything downstream (mocks, provider, trade modules, store, UI) depends on the new columns and TS types being in place. Update existing test fixtures in the same chunk to keep `npm test` green at every step.

#### TT-001 Apply migration `0003_time_travel.sql` and regenerate DB types
**Size**: S | **Layer**: Backend (schema) | **Depends On**: None

**Description**: Add `holdings.first_purchase_date` and `transactions.purchase_date` + `transactions.is_time_traveled` columns. Backfill existing rows. Regenerate `src/lib/supabase/database.types.ts`.

**Acceptance Criteria**:
- [x] `supabase/migrations/0003_time_travel.sql` matches PRD §6 exactly
- [x] Migration adds `holdings.first_purchase_date date NULL`
- [x] Migration adds `transactions.purchase_date date NOT NULL` (with backfill from `quote_timestamp::date`) and `transactions.is_time_traveled boolean NOT NULL DEFAULT false`
- [x] Backfill populates `holdings.first_purchase_date` from earliest BUY `purchase_date` per `(portfolio_id, symbol)`
- [x] Index `transactions_purchase_date_idx (portfolio_id, purchase_date DESC)` created
- [x] Applied via `mcp__supabase__apply_migration`; `list_tables` confirms new columns
- [x] `src/lib/supabase/database.types.ts` regenerated via `mcp__supabase__generate_typescript_types` and reflects the new columns
- [x] No advisor warnings introduced (`get_advisors`)

**Files Likely Affected**:
- `supabase/migrations/0003_time_travel.sql` (new)
- `src/lib/supabase/database.types.ts` (regenerated)

---

#### TT-002 Extend TypeScript types, add validation code, refresh fixtures
**Size**: S | **Layer**: Types | **Depends On**: TT-001

**Description**: Add `HistoricalQuoteResponseData` + `HistoryRangeResponseData` to `market.ts`; extend `FxResponseData` with optional `date`. Add `firstPurchaseDate?` to `Holding`; add required `purchaseDate` + `isTimeTraveled` to `Transaction`. Extend `BuyOrderInput`/`SellOrderInput`/`TradePreview`. Add `'BEFORE_FIRST_PURCHASE'` to `TradeValidationCode`. Update every existing fixture/builder so the project still type-checks and `npm test` passes.

**Acceptance Criteria**:
- [x] `src/types/market.ts` exports `HistoricalQuoteResponseData`, `HistoryRangeResponseData`; `FxResponseData.date?: string` added
- [x] `src/types/portfolio.ts` — `Holding.firstPurchaseDate?: string`; `Transaction.purchaseDate: string` (required) and `Transaction.isTimeTraveled: boolean` (required)
- [x] `src/types/trading.ts` — `BuyOrderInput.purchaseDate?`, `SellOrderInput.purchaseDate?`, `TradePreview.purchaseDate`, `TradePreview.isTimeTraveled`, `TradePreview.fxRateDate?`, `TradePreview.actualPriceDate?`
- [x] `src/lib/trading/errors.ts` — `'BEFORE_FIRST_PURCHASE'` added to `TradeValidationCode` union
- [x] All existing test fixtures across `tests/unit/`, `tests/integration/`, `tests/api/` updated to satisfy the new required fields on `Transaction`
- [x] `npm run typecheck` (or `tsc --noEmit`) and `npm test` pass with zero new failures

**Files Likely Affected**:
- `src/types/market.ts`, `src/types/portfolio.ts`, `src/types/trading.ts`
- `src/lib/trading/errors.ts`
- Existing test fixtures throughout `tests/`

---

### Chunk 2: Mock Data + Provider Interface
> TT-003 + TT-004 — TT-003 builds the data; TT-004 plugs it into the provider boundary. With this chunk green, every downstream test can run in MOCK mode without network.

#### TT-003 Extend mock asset data with 10-year history, historical quote, historical FX, range
**Size**: M | **Layer**: Backend (mock data) | **Depends On**: TT-002

**Description**: Refactor `mockHistory` to lazily generate a deterministic ~3,652-day series per symbol with an optional `{startDate, endDate}` overload. Add `mockHistoricalQuote`, `mockHistoricalFx`, `mockHistoryRange`. Add unit tests.

**Acceptance Criteria**:
- [x] `mockHistory(symbol, outputsize?, opts?)` supports `{ startDate, endDate }` filter, defaults to most-recent `outputsize`
- [x] Series is deterministic per symbol (mulberry32 seeded by symbol hash) and spans ~10 years
- [x] `mockHistoricalQuote(symbol, date)` returns most-recent bar `≤ date` with `actualDate` populated; returns `null` for unknown symbol
- [x] `mockHistoricalFx('USD','CAD',date)` returns deterministic rate (bounded ±5% around 1.37, seeded by `hash(date)`), `freshness: 'FRESH'`, `date` field populated; CAD→CAD short-circuits to 1
- [x] `mockHistoryRange(symbol)` returns `{ earliestDate: today-10y, latestDate: today }`
- [x] New/extended `tests/unit/mockAssets.test.ts` covers: ≥2,500 points across 10y range; chronologically sorted; deterministic across calls; weekend → prior trading day; unknown symbol → `null`; CAD→CAD FX = 1

**Files Likely Affected**:
- `src/lib/market-data/mock/mockAssets.ts`
- `tests/unit/mockAssets.test.ts` (new or extended)

---

#### TT-004 Extend `MarketDataProvider` interface + wire mock impl + stub Twelve Data impl
**Size**: S | **Layer**: Backend (provider) | **Depends On**: TT-003

**Description**: Add `getHistoricalQuoteAt`, `getHistoricalExchangeRate`, `getHistoryRange` to the provider interface. Implement on `mockMarketDataProvider` mapping to the §9 builders. Stub the Twelve Data provider methods returning `null` (real wiring in TT-007) so the project compiles and mock-mode tests can pass.

**Acceptance Criteria**:
- [x] `src/lib/market-data/provider.ts` interface includes the three new methods (signatures per PRD §8)
- [x] `src/lib/market-data/mock/mockProvider.ts` implements all three by delegating to `mockHistoricalQuote` / `mockHistoricalFx` / `mockHistoryRange`
- [x] `src/lib/market-data/twelveDataProvider.ts` declares the three new methods returning `null` with a TODO comment pointing at TT-007
- [x] `npm run typecheck` and `npm test` pass

**Files Likely Affected**:
- `src/lib/market-data/provider.ts`
- `src/lib/market-data/mock/mockProvider.ts`
- `src/lib/market-data/twelveDataProvider.ts`

---

### Chunk 3: Server API Routes
> TT-005 + TT-006 — Both API routes are independent of each other and depend only on the existing `twelveDataFetch` + cache helpers. They can be implemented in parallel.

#### TT-005 New route `/api/market/history/range` + `HISTORY_RANGE_MS` cache TTL
**Size**: M | **Layer**: Backend (API) | **Depends On**: TT-002

**Description**: Implement the convenience endpoint per PRD §7.1 — asks Twelve Data for `time_series` with `outputsize=5000, interval=1day` and returns `{ earliestDate, latestDate }`. Cache for 24h. Add `HISTORY_RANGE_MS` to `CACHE_TTL`. Surface envelope errors using existing `apiOk` / `apiError` helpers.

**Acceptance Criteria**:
- [x] `src/app/api/market/history/range/route.ts` matches PRD §7.1 (GET handler, `symbol` query, envelope responses, cache key `history-range:${symbol}`)
- [x] `src/lib/market-data/cache.ts` exports `CACHE_TTL.HISTORY_RANGE_MS = 24 * 60 * 60 * 1000`
- [x] Empty `points` → `apiError('HISTORY_UNAVAILABLE', …)`; cache hits return `{ cached: true }`
- [x] `tests/api/history-range.test.ts` covers: success (earliest + latest extracted from mocked TD response), cached path, empty-history error, upstream error passthrough

**Files Likely Affected**:
- `src/app/api/market/history/range/route.ts` (new)
- `src/lib/market-data/cache.ts`
- `tests/api/history-range.test.ts` (new)

---

#### TT-006 Extend `/api/market/fx` with optional `date=` parameter + `FX_HISTORICAL_MS` cache TTL
**Size**: M | **Layer**: Backend (API) | **Depends On**: TT-002

**Description**: When `date=YYYY-MM-DD` is present, fetch `USD/CAD` via Twelve Data `time_series` with `start_date=end_date=date, outputsize=5`, return the most recent point (`≤ date`). Cache key `fx:USD:CAD:${date}`, TTL 7 days. Existing today-rate path is unchanged.

**Acceptance Criteria**:
- [x] `src/app/api/market/fx/route.ts` accepts optional `date` query (per PRD §7.2)
- [x] Response `FxResponseData.date` populated when a historical lookup occurred; `freshness: 'FRESH'`
- [x] Empty points → `apiError('FX_UNAVAILABLE', …)`
- [x] `src/lib/market-data/cache.ts` exports `CACHE_TTL.FX_HISTORICAL_MS = 7 * 24 * 60 * 60 * 1000`
- [x] `tests/api/fx.test.ts` extended with a `?date=2020-01-02` case (success, cache, fallback to prior trading day)
- [x] No regression in the today-rate code path

**Files Likely Affected**:
- `src/app/api/market/fx/route.ts`
- `src/lib/market-data/cache.ts`
- `tests/api/fx.test.ts`

---

### Chunk 4: Twelve Data Provider Wiring
> TT-007 — Replaces the stubs from TT-004 with real calls to the routes built in Chunk 3.

#### TT-007 Implement real Twelve Data provider methods
**Size**: S | **Layer**: Backend (provider) | **Depends On**: TT-005, TT-006

**Description**: Replace the `null`-returning stubs in `twelveDataProvider.ts` with real calls to `/api/market/history?symbol=…&interval=1day&start_date=D&end_date=D`, `/api/market/fx?from=USD&to=CAD&date=D`, and `/api/market/history/range?symbol=…`. The caller (store) overrides currency from the live quote, as documented in PRD §8.1.

**Acceptance Criteria**:
- [x] `getHistoricalQuoteAt` calls the existing `/api/market/history` route with `start_date=end_date=date`, returns the last point mapped to `HistoricalQuoteResponseData` with `actualDate` from the bar's timestamp
- [x] `getHistoricalExchangeRate` calls `/api/market/fx?date=…` and returns the `FxResponseData` envelope directly
- [x] `getHistoryRange` calls `/api/market/history/range` and returns the envelope directly
- [x] All three return `null` on `!ok` or empty data (so the store can throw a friendly validation error)
- [x] Provider-level tests (if a `twelveDataProvider.test.ts` exists) exercise success + null-on-failure paths against a mocked fetch

**Files Likely Affected**:
- `src/lib/market-data/twelveDataProvider.ts`
- `tests/unit/twelveDataProvider.test.ts` (if exists — extend)

---

### Chunk 5: Pure Trade Modules
> TT-008 — Single chunk because `buy.ts`, `sell.ts`, `apply.ts` are tightly coupled by shared types and `firstPurchaseDate` semantics. Lands with its own unit tests so the trade pipeline is provably correct before the store wires it up.

#### TT-008 Extend `buy.ts`, `sell.ts`, `apply.ts` with historical price + first-purchase gating
**Size**: M | **Layer**: Backend (pure lib) | **Depends On**: TT-002

**Description**: Thread `historicalQuote` through `BuildBuyPreviewInput` / `BuildSellPreviewInput`. Compute `priceNative` from `historicalQuote?.closeNative ?? quote.priceNative`. Compute `purchaseDate` and `isTimeTraveled` on the resulting `TradePreview`. In `sell.ts`, throw `TradeValidationError('BEFORE_FIRST_PURCHASE')` when `order.purchaseDate < holding.firstPurchaseDate`. In `apply.ts`, set `firstPurchaseDate` on new holdings and *only move it earlier* when an older back-dated buy lands (see PRD §10.3 snippet). Thread `purchaseDate` + `isTimeTraveled` into the resulting `Transaction`. Set `quoteTimestamp` to the historical bar's timestamp.

**Acceptance Criteria** (test cases that must pass):
- [x] `buildBuyPreview` with `historicalQuote` uses historical close, not live `quote.priceNative`
- [x] `buildBuyPreview` always sets `purchaseDate` (defaulting to today when no order date) and correct `isTimeTraveled`
- [x] `buildSellPreview` throws `BEFORE_FIRST_PURCHASE` when `purchaseDate < holding.firstPurchaseDate`
- [x] `buildSellPreview` accepts `purchaseDate === holding.firstPurchaseDate` (boundary)
- [x] `applyBuy` sets `firstPurchaseDate` on a newly created holding
- [x] `applyBuy` keeps the earlier `firstPurchaseDate` when a later back-dated buy lands
- [x] `applyBuy` moves `firstPurchaseDate` earlier when the new buy's `purchaseDate` is older than the recorded first
- [x] Both `applyBuy` and `applySell` emit transactions carrying `purchaseDate` and `isTimeTraveled`
- [x] With slider at "Today" (no `historicalQuote`, no `order.purchaseDate`), behavior is byte-identical to current — existing `tests/unit/trading.test.ts` cases pass without semantic changes

**Files Likely Affected**:
- `src/lib/trading/buy.ts`
- `src/lib/trading/sell.ts`
- `src/lib/trading/apply.ts`
- `tests/unit/trading.test.ts` (extend)
- `tests/unit/apply.test.ts` (new or extend)

---

### Chunk 6: Store + Persistence
> TT-009 + TT-010 — TT-009 wires the historical-data fetching into `previewBuy/Sell` and adds three new store actions; TT-010 plumbs the new fields through Supabase reads/writes and bumps localStorage with a backfill migration. Done together because TT-010's reads/writes have nothing to test until TT-009 exists to produce the new in-memory state.

#### TT-009 Add three store actions and modify `previewBuy` / `previewSell` for historical paths
**Size**: M | **Layer**: Backend (store) | **Depends On**: TT-004, TT-008

**Description**: Add `getHistoricalQuoteAt`, `getHistoricalFxAt`, `getHistoryRange` actions to `simulatorStore`. In `previewBuy`/`previewSell`, when `order.purchaseDate` is present and not today: fetch historical quote, fetch historical FX (only when live quote is USD), then call the pure module with `historicalQuote` set. When equal to today or absent, code path is unchanged but the resulting preview must still carry `purchaseDate = today` and `isTimeTraveled = false`. Override `historicalQuote.currency` from the live quote's currency.

**Acceptance Criteria**:
- [x] `simulatorStore` exposes the three new actions (signatures per PRD §11.1)
- [x] `previewBuy({ ..., purchaseDate: 'YYYY-MM-DD' })` for a USD asset performs both historical-quote and historical-FX fetches via the provider
- [x] `previewBuy({ ..., purchaseDate: 'YYYY-MM-DD' })` for a CAD asset uses `fxRate = 1` and does not call `getHistoricalExchangeRate`
- [x] Missing historical quote → `TradeValidationError('NO_QUOTE', 'No price data on that date.')`
- [x] Missing historical FX (USD asset) → `TradeValidationError('UNSUPPORTED_CURRENCY', 'No FX rate for that date.')`
- [x] A trade with `purchaseDate === today` is **indistinguishable** from one with `purchaseDate` omitted (regression guard in `tests/integration/storeFlows.test.ts`)
- [x] New `tests/integration/timeTravel.test.ts` covers: end-to-end `previewBuy` uses historical close; cash deducted = `qty × histClose × histFx`; back-dated SELL before `firstPurchaseDate` throws; SELL after succeeds; `firstPurchaseDate` updates to an even-earlier subsequent buy

**Files Likely Affected**:
- `src/store/simulatorStore.ts`
- `tests/integration/timeTravel.test.ts` (new)
- `tests/integration/storeFlows.test.ts` (regression guard added)

---

#### TT-010 Persistence — Supabase sync, `loadFromSupabase`, localStorage version bump + migration
**Size**: M | **Layer**: Backend (persistence) | **Depends On**: TT-001, TT-009

**Description**: Write `purchase_date` and `is_time_traveled` from `Transaction`s and `first_purchase_date` from `Holding`s in `persistAfterTrade`. Read those columns in `loadFromSupabase` and surface them on the in-memory `Portfolio`/`Holding`/`Transaction`. Bump the localStorage `version` constant in `src/lib/persistence/localStorage.ts`; add a migration step: backfill `transaction.purchaseDate` from `transaction.timestamp.slice(0, 10)` and `isTimeTraveled = false`; backfill `holding.firstPurchaseDate` from the earliest BUY for that symbol.

**Acceptance Criteria**:
- [x] `persistAfterTrade` insert payload includes `purchase_date` + `is_time_traveled`; holdings upsert includes `first_purchase_date` (`null` allowed)
- [x] `loadFromSupabase` maps `purchase_date` → ISO `YYYY-MM-DD`, `is_time_traveled` → boolean, `first_purchase_date` → optional ISO date
- [x] `localStorage.ts` `version` constant bumped; load path detects an older version and runs the backfill migration deterministically
- [x] `tests/unit/persistence.test.ts` (or equivalent) covers: legacy state without `purchaseDate` → migrated successfully; legacy state without `firstPurchaseDate` → backfilled from earliest BUY
- [x] Manual smoke: in `npm run dev` API mode, complete a time-traveled buy → reload browser → state survives with both new columns

**Files Likely Affected**:
- `src/lib/persistence/supabaseSync.ts`
- `src/lib/persistence/localStorage.ts`
- `tests/unit/persistence.test.ts`

---

### Chunk 7: UI Components
> TT-011..TT-013 — TT-011 ships the new slider in isolation; TT-012 integrates it into `TradeTicket` and drives the live preview chips; TT-013 makes the modal + downstream tables surface the time-traveled metadata. TT-012 depends on TT-011 and TT-009. TT-013 can run in parallel with TT-012 (no shared files).

#### TT-011 Build `HistoricalDateSlider` component
**Size**: M | **Layer**: Frontend | **Depends On**: TT-002

**Description**: New `src/components/trading/HistoricalDateSlider.tsx` matching PRD §3.2 layout and §12.1 prop contract. Native `<input type="range">` + `<input type="date">` pair; year-tick labels computed from span (5y / 2y / 1y bins). "Today" button. Internal state syncs with `value` prop via `useEffect`. Supports `minDate` + `minDateReason` clamp for the SELL gating use case.

**Acceptance Criteria**:
- [x] Component renders the layout in §3.2 — eyebrow ("PURCHASE DATE"), date input, range slider, year ticks, "Today" reset
- [x] Range step = 1 day; `min` / `max` derived from `earliestDate` / `latestDate`; date input `min` / `max` matched
- [x] Out-of-range typed date snaps to bound
- [x] `loading` prop renders the disabled "Loading available range…" skeleton state
- [x] `minDate` clamps the slider; `minDateReason` renders inline below the input
- [x] A11y: `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext="Mon DD, YYYY"`; keyboard ±1 day (Left/Right), ±30 days (PageUp/Down), Home/End → bounds; date input has a label
- [x] "Today" button calls `onChange(todayISO())` and visually de-emphasizes the track
- [x] Uses existing tokens (`var(--color-accent)`, tabular numerals) — no new globals
- [x] Smoke test renders at multiple ranges (10y / 25y / 2y) and asserts year-tick density

**Files Likely Affected**:
- `src/components/trading/HistoricalDateSlider.tsx` (new)
- `tests/unit/HistoricalDateSlider.test.tsx` (new, lightweight)

---

#### TT-012 Integrate slider into `TradeTicket` with debounced preview chips
**Size**: L | **Layer**: Frontend | **Depends On**: TT-009, TT-011

**Description**: Add `purchaseDate`, `range`, `rangeLoading`, `historicalQuote`, `historicalFx` state to `TradeTicket`. Fetch `getHistoryRange(symbol)` on mount/symbol change. On `purchaseDate` change ≠ today, debounce 200 ms and call `getHistoricalQuoteAt` + `getHistoricalFxAt` (latter only for USD assets). Render the "Price on …" / "FX on that date" chips. Pass `purchaseDate` through to `previewBuy` / `previewSell`. SELL tab passes `holding.firstPurchaseDate` as the slider's `minDate`. "Estimated total" uses `historicalQuote?.closeNative ?? quote.priceNative`.

**Acceptance Criteria**:
- [x] Slider mounts on both BUY and SELL tabs, above Quantity, with `latestDate = today`
- [x] Default state on first render: slider at "Today", de-emphasized; behaves identically to current `TradeTicket`
- [x] Dragging the slider debounces (200 ms) before fetching; chips show a spinner while pending and "—" on no data
- [x] `getHistoryRange` fetched once per symbol; `rangeLoading` controls the disabled skeleton
- [x] SELL tab: `minDate` = `holding?.firstPurchaseDate`; inline message renders when present; `Preview Sell →` disabled when no data or clamped state
- [x] "Used close of {actualDate} (markets closed)" note rendered when `actualPriceDate !== purchaseDate`
- [x] Errors surfaced inline: history-range fail → "Couldn't load this asset's price history. Try again." + Retry; missing price → "No price data on that date." + disabled Preview
- [x] Rate-limit → friendly toast reusing existing `RATE_LIMITED` UX; slider stays clickable
- [x] Manual smoke in `npm run dev` MOCK mode confirms full flow

**Files Likely Affected**:
- `src/components/trading/TradeTicket.tsx`

---

#### TT-013 Confirmation modal badge + transaction table + holdings table updates
**Size**: S | **Layer**: Frontend | **Depends On**: TT-002, TT-009

**Description**: `TradeConfirmationModal` — add "Time-traveled" badge near the title and a "Purchase date" row when `preview.isTimeTraveled`. `TransactionHistoryTable` — render `transaction.purchaseDate` as the primary row date, with a muted "logged {timeAgo}" subtitle from `timestamp`, plus the "Time-traveled" badge when applicable. `HoldingsTable` — new "First bought" column between "Symbol" and "Quantity", showing formatted `firstPurchaseDate` or `—`.

**Acceptance Criteria**:
- [x] `TradeConfirmationModal` shows "Time-traveled" badge only when `preview.isTimeTraveled === true`; renders "Purchase date: {formatted}" row above the totals
- [x] `TransactionHistoryTable` primary date = `formatDate(transaction.purchaseDate)`; subtitle = muted "logged {timeAgo}" from `timestamp`; badge appears when `transaction.isTimeTraveled === true`
- [x] `HoldingsTable` has a new "First bought" column (header + cell); `—` rendered when `firstPurchaseDate` is missing
- [x] No regressions on rows lacking the new fields (legacy/migrated data)
- [x] Existing snapshot or row-count assertions in `tests/unit/portfolio.test.ts` updated to account for the new column

**Files Likely Affected**:
- `src/components/trading/TradeConfirmationModal.tsx`
- `src/components/portfolio/TransactionHistoryTable.tsx`
- `src/components/portfolio/HoldingsTable.tsx`
- `tests/unit/portfolio.test.ts` (extend)

---

### Chunk 8: E2E Verification
> TT-014 — Final gate. Walks the whole stack (mock provider → store → UI → confirmation modal → portfolio tables) for both BUY and SELL scenarios. Maps to PRD §17 acceptance criteria.

#### TT-014 Playwright specs — buy and sell time-travel flows
**Size**: M | **Layer**: Testing (E2E) | **Depends On**: TT-010, TT-012, TT-013

**Description**: Two new Playwright specs running against the dev server in MOCK data mode, covering the user-visible criteria 1–10 from PRD §17.

**Acceptance Criteria**:
- [x] `tests/e2e/asset-time-travel.spec.ts` — Visit `/asset/AAPL`; slider earliest ≈ today-10y; drag to a clearly historical date; quantity = 5; preview button shows "Time-traveled" badge in modal; confirm; `/portfolio` shows row with badge + historical primary date; HoldingsTable "First bought" reads the historical date
- [x] `tests/e2e/asset-time-travel-sell.spec.ts` — After buying AAPL on 2018-01-02, switch to SELL tab, drag slider to 2017-06-01 → slider clamps + inline error + Preview disabled; drag to 2019-01-02 → Preview Sell succeeds; resulting transaction has the historical sell price + chosen `purchaseDate`
- [x] Both specs run green in CI (or `npx playwright test` locally) against MOCK mode
- [x] No network calls leak out of MOCK mode (assert via Playwright route blocking, optional)

**Files Likely Affected**:
- `tests/e2e/asset-time-travel.spec.ts` (new)
- `tests/e2e/asset-time-travel-sell.spec.ts` (new)

---

## Dependency Graph

```
Chunk 1 (sequential)            Chunk 2 (sequential)        Chunk 3 (parallel)         Chunk 4
┌──────────────────────┐        ┌──────────────────────┐    ┌──────────────────────┐   ┌────────────┐
│ TT-001 migration     │──┐  ┌─▶│ TT-003 mock data 10y │    │ TT-005 /history/range│──▶│ TT-007 TD  │
│ TT-002 types         │──┴──┴─▶│ TT-004 provider iface│    │ TT-006 /fx?date=     │   │  provider  │
└──────────────────────┘        └──────────────────────┘    └──────────────────────┘   └────────────┘
            │                              │                            │                      │
            ▼                              ▼                            └──────────┬───────────┘
       Chunk 5                          Chunk 6                                    │
┌──────────────────────┐        ┌──────────────────────┐                           │
│ TT-008 pure trade    │───────▶│ TT-009 store         │◀──────────────────────────┘
│  modules (buy/sell/  │        │ TT-010 persistence   │
│  apply + gating)     │        └──────────────────────┘
└──────────────────────┘                  │
                                          ▼
                                       Chunk 7 (TT-011 → TT-012 ‖ TT-013)
                                ┌──────────────────────────────────┐
                                │ TT-011 HistoricalDateSlider      │
                                │     │                            │
                                │     ├─▶ TT-012 TradeTicket       │
                                │     └─▶ TT-013 Modal + tables    │
                                └──────────────────────────────────┘
                                          │
                                          ▼
                                       Chunk 8
                                ┌──────────────────────────────────┐
                                │ TT-014 Playwright E2E (BUY/SELL) │
                                └──────────────────────────────────┘
```

---

## Technical Notes

- **Module boundary discipline** (PRD §4.2): pure trade modules receive historical quote/FX/date as inputs and never fetch. Provider owns "how to get a historical quote/FX." Store orchestrates fetch → pure preview build. UI calls store actions only.
- **Currency** of `HistoricalQuoteResponseData` from the Twelve Data provider is overridden by the store from the live quote's currency before being passed into `buildBuyPreview` — the provider returns a placeholder `'USD'` (PRD §8.1).
- **Holdings value-at-today semantics**: `refreshHoldingQuotes` is unchanged. Today's live quote is the right value to display regardless of when the holding was bought. There is no back-fill of `portfolio_snapshots`.
- **Per-lot accounting is explicitly out of scope.** Holdings remain weighted-average cost; a back-dated SELL that predates a *later* same-symbol BUY is permitted (documented simplification).
- **`firstPurchaseDate` invariant** (PRD §10.3): once set, only ever moves earlier — never raised by a later same-symbol back-dated BUY.
- **Existing trades must remain byte-identical**: every chunk ends with `npm test` green and Chunk 6 + Chunk 7 explicitly include a "slider-at-today === today's path" regression guard.
- **Cache TTLs**: historical FX = 7d, history-range = 24h. Today's FX cache is untouched and uses a different key shape — no cross-contamination.

---

## Quality Checklist

- [x] Every PRD requirement (§3, §5–§12, §17) maps to at least one task
- [x] No task larger than L; the only L is TT-012 (TradeTicket integration), which the PRD explicitly calls out as the biggest visible change
- [x] Dependencies form a DAG (verified in graph)
- [x] Acceptance criteria are testable and trace to PRD §17 where applicable
- [x] Out-of-scope items (§2 non-goals) are NOT included as tasks
- [x] Each chunk has clear rationale (parallel, shared concern, or dependency chain)
- [x] Chunk order respects dependencies — no chunk depends on a later one
- [x] Chunks are sized for 2–6h focused sessions
