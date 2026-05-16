# Personal Stock Market Simulator MVP — Tasks

**Source**: plan.md
**Generated**: 2026-05-15

## Overview

| Metric | Count |
|--------|------:|
| Total Tasks | 64 |
| Foundation/Setup | 4 |
| Backend (API/DB) | 18 |
| Frontend (UI) | 28 |
| Integration | 10 |
| Testing | 4 |
| Implementation Chunks | 22 |

## Feature Summary

A single-user stock/ETF trading simulator that starts the user with $5,000 CAD virtual cash. Users search supported assets via Twelve Data, buy/sell fractional shares, see portfolio analytics (gains/losses, allocation, diversification score), receive risk warnings, learn investing terms in a Learning Center, and explore long-term growth via a compound interest tool. Tech stack is locked: Next.js App Router on Vercel, TypeScript, Tailwind, Zustand, Chart.js, Supabase (Postgres + Auth + RLS) as source of truth, localStorage as cache, internal API routes proxying Twelve Data.

## Implementation Chunks

| Chunk | Tasks | Description | Size |
|------:|-------|-------------|:----:|
| **1** | T-001..T-004 | Project foundation — Next.js scaffold, deps, folders, env | L |
| **2** | T-005..T-007 | Type model — state, portfolio, trading, market, learning types | M |
| **3** | T-008..T-010 | Mock market data + content seed | M |
| **4** | T-011..T-014 | Calculation modules — cost basis, PnL, allocation, FX | L |
| **5** | T-015..T-017 | Trading module — buy/sell validation + apply | M |
| **6** | T-018..T-020 | Zustand store + localStorage persistence | M |
| **7** | T-021..T-023 | App shell, navigation, design tokens | M |
| **8** | T-024..T-025 | Setup page + Settings page (with reset) | M |
| **9** | T-026..T-028 | Browse page + Asset detail (mock-backed) | L |
| **10** | T-029..T-031 | Trade ticket + buy/sell modals | L |
| **11** | T-032..T-034 | Portfolio page — summary, holdings, transactions | L |
| **12** | T-035..T-037 | Internal API routes — search, quote, fx | L |
| **13** | T-038..T-039 | Internal API route — history + cache layer | M |
| **14** | T-040..T-041 | Frontend market-data client + provider switching | M |
| **15** | T-042..T-044 | Charts — portfolio value, sector allocation, asset history | L |
| **16** | T-045..T-047 | Learning Center content + pages + tooltip linking | L |
| **17** | T-048..T-050 | Diversification + risk modules + warning UI/lifecycle | L |
| **18** | T-051..T-052 | Compound growth tool | M |
| **19** | T-053..T-055 | Supabase schema, RLS, types | L |
| **20** | T-056..T-058 | Supabase clients + auth flows + protected routes | L |
| **21** | T-059..T-061 | Supabase persistence sync (writes + reads + status) | L |
| **22** | T-062..T-064 | Tests — unit, integration, E2E | L |

---

## Implementation Order

### Chunk 1: Project Foundation
> T-001..T-004 — Must come first; everything depends on a working Next.js scaffold and folder structure.

#### T-001 Initialize Next.js App Router project ✅
**Size**: M | **Layer**: Foundation | **Depends On**: None

**Description**: Bootstrap Next.js 14+ App Router project with TypeScript, Tailwind, and ESLint. Configure for Vercel deployment.

**Acceptance Criteria**:
- [x] `npx create-next-app@latest` with TypeScript, Tailwind, App Router, ESLint, `src/` directory
- [x] `next dev` runs and renders default landing
- [x] `tsconfig.json` strict mode enabled
- [x] Tailwind config wired to `src/app/**` and `src/components/**` (Tailwind v4 uses CSS `@import "tailwindcss"` in `globals.css`, not `tailwind.config.ts`)

**Completion notes (2026-05-15)**:
- create-next-app installed **Next 16.2.6** (latest), **React 19.2.4**, **Tailwind v4**, **ESLint 9 flat config**, **Turbopack** enabled for dev/build.
- Tailwind v4 has no `tailwind.config.ts`; design tokens (T-021) will go in a CSS `@theme` block in `globals.css`.
- `next lint` is replaced with direct `eslint` invocation in `package.json` scripts.

**Files Likely Affected**:
- `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`

---

#### T-002 Install runtime dependencies ✅
**Size**: S | **Layer**: Foundation | **Depends On**: T-001

**Description**: Install Zustand, Chart.js + react-chartjs-2, Supabase SDK, and uuid.

**Acceptance Criteria**:
- [x] `zustand` installed (5.0.13)
- [x] `chart.js` (4.5.1) + `react-chartjs-2` (5.3.1) installed
- [x] `@supabase/supabase-js` (2.105.4) + `@supabase/ssr` (0.10.3) installed
- [x] `uuid` (14.0.0) + `@types/uuid` (10.0.0) installed
- [x] `npm run build` passes

**Files Likely Affected**:
- `package.json`, `package-lock.json`

---

#### T-003 Create folder structure per PRD §14.6 ✅
**Size**: S | **Layer**: Foundation | **Depends On**: T-001

**Description**: Pre-create directory tree so subsequent tasks land files in the right place.

**Acceptance Criteria**:
- [x] All `src/app/...` route folders created (page.tsx/route.ts arrive in their respective tasks)
- [x] All `src/{components,content,lib,store,types}` sub-folders created per PRD §14.6
- [x] Each folder has `.gitkeep`
- [x] Added `src/lib/learning/` for the learning helpers from T-010 (not in PRD §14.6 but needed by task plan)

**Files Likely Affected**:
- All folders under `src/`

---

#### T-004 Configure environment variable scaffolding ✅
**Size**: S | **Layer**: Foundation | **Depends On**: T-001

**Description**: Define `.env.example` with all required keys, wire into Next.js, and document client/server separation rules.

**Acceptance Criteria**:
- [x] `.env.example` lists `TWELVE_DATA_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] No `NEXT_PUBLIC_TWELVE_DATA_*` variable referenced
- [x] `.env.local` gitignored (`.env*` with `!.env.example` exception so the template can be committed)
- [x] Inline comments in `.env.example` document server-only vs browser-safe vars

**Files Likely Affected**:
- `.env.example`, `.gitignore`

---

### Chunk 2: Type Model
> T-005..T-007 — Shared TypeScript types feed every later layer; all parallel-safe within the chunk.

#### T-005 Define market & API contract types ✅
**Size**: M | **Layer**: Backend | **Depends On**: T-003

**Description**: Implement `ApiSuccess<T>`/`ApiError` envelope, `AssetSearchResult`, `QuoteResponseData`, `HistoricalPricePoint`, `FxResponseData`, freshness enums, and standard error code union per PRD §26.

**Acceptance Criteria**:
- [x] `src/types/market.ts` exports all types from PRD §26.1–26.5
- [x] Error code union matches PRD §26.5 exactly (12 codes)
- [x] `freshness` is a string-literal union (`'FRESH' | 'RECENT' | 'STALE' | 'UNAVAILABLE'`)
- [x] Convenience union `ApiResponse<T> = ApiSuccess<T> | ApiError` exported for callers

**Files Likely Affected**:
- `src/types/market.ts`

---

#### T-006 Define portfolio, trading & state types ✅
**Size**: M | **Layer**: Backend | **Depends On**: T-003

**Description**: Implement `LocalUser`, `SimulationConfig`, `Portfolio`, `Holding`, `Transaction`, `PortfolioSnapshot`, `RiskWarning`, `BuyOrderInput`/`SellOrderInput`, `TradePreview`, `TradeResult`, `SimulatorStoreState` per PRD §15 + §27.

**Acceptance Criteria**:
- [x] `src/types/portfolio.ts` (data records) + `src/types/trading.ts` (trade flow inputs/preview/result)
- [x] Field names and literal unions match PRD verbatim
- [x] No `any`; ISO timestamps typed `string`, money/quantity typed `number`
- [x] `AuthSessionStatus`, `SyncStatus`, `MarketDataMode` added (PRD §27.1, §34.11, §24.8) — needed by store
- [x] `Transaction` placed in portfolio.ts (Portfolio owns the array); trading.ts imports from portfolio.ts to avoid circular dep
- [x] `SimulatorStoreState` deferred to `src/store/simulatorStore.ts` (T-018) since it's a runtime concern, not a type-only export

**Files Likely Affected**:
- `src/types/portfolio.ts`, `src/types/trading.ts`

---

#### T-007 Define education/learning types ✅
**Size**: S | **Layer**: Backend | **Depends On**: T-003

**Description**: Implement `LearningTerm` and category union per PRD §15.9.

**Acceptance Criteria**:
- [x] `src/types/learning.ts` exports `LearningTerm` + `LearningCategory`
- [x] Category union matches the six PRD §9.7 categories
- [x] Includes `relatedSlugs: string[]`
- [x] `src/types/education.ts` adds UI projection types (`LearningCategoryMeta`, `TermSummary`) for category tabs and card views

**Files Likely Affected**:
- `src/types/learning.ts`, `src/types/education.ts`

---

### Chunk 3: Mock Data + Seed Content
> T-008..T-010 — Independent content files needed before UI can render anything realistic.

#### T-008 Mock market data set ✅
**Size**: M | **Layer**: Backend | **Depends On**: T-005

**Description**: Hand-built fixture covering supported exchanges/currencies/sectors with quote, search, history, and FX shapes that match the API contract.

**Acceptance Criteria**:
- [x] **16 assets** across NASDAQ/NYSE/NYSE ARCA/TSX (4 USD ETFs, 2 CAD ETFs, mixed stocks)
- [x] Each asset has sector, price, daily change; 30 historical points generated procedurally via mulberry32 PRNG seeded by symbol (deterministic for tests)
- [x] Mock USD/CAD FX rate (`MOCK_FX_USD_CAD = 1.37`); CAD→CAD short-circuits to 1
- [x] Returned shapes match `AssetSearchResult` / `QuoteResponseData` / `HistoricalPricePoint[]` / `FxResponseData` (verified via tsc)
- [x] `mockProvider.ts` exposes `searchSymbols`, `getQuote`, `getQuotes`, `getHistoricalPrices`, `getExchangeRate` for use prior to T-040 wrapping

**Files Likely Affected**:
- `src/lib/market-data/mock/mockAssets.ts`, `src/lib/market-data/mock/mockProvider.ts`

---

#### T-009 Learning term content (30 terms) ✅
**Size**: L | **Layer**: Frontend | **Depends On**: T-007

**Description**: Author all required learning terms from PRD §28 into a typed content array.

**Acceptance Criteria**:
- [x] All **30** required terms present (PRD §24.9 — Market 7, Portfolio 7, Gains 5, Risk 6, Long-Term/Sim 5). Original task plan said "29" — actual count corrected.
- [x] Each term has `slug`, `title`, `category`, `shortDefinition`, `simpleDefinition`, `inSimulator`, `whyItMatters`, `example`, `relatedSlugs`
- [x] `relatedSlugs` reference only slugs in this file — verified via grep (30 unique references, 0 dangling). PRD §28 references to undefined terms (`Currency Conversion`, `Quote`, `Buy`, `Sell`, `Holding`) were dropped.
- [x] Copy taken from PRD §28 verbatim

**Files Likely Affected**:
- `src/content/learningTerms.ts`

---

#### T-010 Learning slug → UI label registry ✅
**Size**: S | **Layer**: Frontend | **Depends On**: T-009

**Description**: Helper that maps UI labels (e.g., `Average Cost`, `Realized Gain/Loss`) to learning term slugs so `LearningLink` components can be rendered consistently.

**Acceptance Criteria**:
- [x] `getTermBySlug(slug)` returns term or `null`
- [x] `getTermsByCategory(category)` returns terms in that category
- [x] `searchTerms(query)` does case-insensitive title/short/simple definition match
- [x] `LEARN.*` slug constant object exported (autocomplete-friendly references for `<LearningLink slug={LEARN.AVERAGE_COST} />`)
- [x] `LEARNING_CATEGORY_LABELS` + `LEARNING_CATEGORIES_META` exported for category tabs
- [x] `getRelatedTerms(term)` resolves the term's `relatedSlugs[]` to full term records

**Files Likely Affected**:
- `src/lib/learning/index.ts`

---

### Chunk 4: Calculation Modules
> T-011..T-014 — Pure-function math libraries used by the trading module, store selectors, and UI. Independent and parallel-safe.

#### T-011 Cost basis & average cost ✅
**Size**: S | **Layer**: Backend | **Depends On**: T-006

**Description**: Average-cost basis updates per PRD §10.3 and §24.5.

**Acceptance Criteria**:
- [x] `recalcAverageCost(oldQty, oldAvg, addQty, addPrice)` matches PRD formula; verified with `(0,0,1,100)→100` and `(1,100,1,120)→110`
- [x] Partial sell does not change average cost (no sell-side function — sell flow keeps `averageCostCad` untouched per PRD §24.5)
- [x] `isHoldingClosed(remaining)` returns true when `remaining ≤ HOLDING_CLOSE_EPSILON (1e-6)`
- [x] Throws on `addQuantity ≤ 0` to catch upstream validation bugs early

**Files Likely Affected**:
- `src/lib/calculations/costBasis.ts`

---

#### T-012 Portfolio analytics ✅
**Size**: M | **Layer**: Backend | **Depends On**: T-006, T-011

**Description**: All portfolio metrics from PRD §11 — holding market value, unrealized G/L, total value, total return CAD/%, allocations.

**Acceptance Criteria**:
- [x] All PRD §11.2 formulas implemented: `holdingMarketValue`, `holdingUnrealizedGainLoss`, `holdingUnrealizedGainLossPercent`, `investedValueCad`, `portfolioValueCad`, `totalReturnCad`, `totalReturnPercent`, `unrealizedGainLossTotalCad`
- [x] Pure functions, individually exported; no rounding inside (display layer rounds)
- [x] Allocation: `holdingAllocationPercent` + `cashAllocationPercent` together sum to 100 (when totalPortfolioValue > 0)
- [x] `sectorBreakdownCad` returns sector→CAD map; missing sector → `'Unknown'` per PRD §16
- [x] Smoke-tested: `marketValue(2@110)=220`, `costBasis(2@100)=200`, `unrealizedGL=20`, `totalReturn(5300/5000)=6%`

**Files Likely Affected**:
- `src/lib/calculations/portfolio.ts`

---

#### T-013 Realized gain/loss ✅
**Size**: S | **Layer**: Backend | **Depends On**: T-011

**Description**: Compute realized G/L on sells per PRD §24.5: `quantitySold × (sellPriceCad − averageCostCad)`.

**Acceptance Criteria**:
- [x] Returns raw CAD number — display layer rounds (PRD §18.8)
- [x] Negative when `sellPrice < averageCost`; zero when equal
- [x] Throws on `quantitySold ≤ 0`
- [x] Verified: `realized(1, 130, 110) = 20`

**Files Likely Affected**:
- `src/lib/calculations/realizedGainLoss.ts`

---

#### T-014 FX & currency conversion ✅
**Size**: S | **Layer**: Backend | **Depends On**: T-005

**Description**: Currency conversion helpers per PRD §18.3 — CAD pass-through, USD via FX rate, cached-FX guard.

**Acceptance Criteria**:
- [x] `toCad(priceNative, currency, fxRate)` — CAD passes through unchanged, USD multiplies by rate
- [x] `fromCad(amountCad, currency, fxRate)` for inverse (asset detail native price display)
- [x] `assertFxAvailable(currency, fx)` throws `FxUnavailableError` when non-CAD currency has `null`/`NaN`/`≤0` rate
- [x] `getFxRateOrNull` convenience returns `null` instead of throwing
- [x] `FxRate = number | null` — `null` distinguishes "not fetched / unavailable" from `0`
- [x] Tests deferred to T-062 (unit tests chunk)

**Files Likely Affected**:
- `src/lib/currency/index.ts`

---

### Chunk 5: Trading Module
> T-015..T-017 — Wraps the calc modules into validated buy/sell flows. Sequential within the chunk because preview feeds execute.

#### T-015 Buy order validation + preview
**Size**: M | **Layer**: Backend | **Depends On**: T-012, T-014

**Description**: Validate quantity/cash/quote/asset support and compute `TradePreview` per PRD §10.1 + §27.4.

**Acceptance Criteria**:
- [ ] Rejects qty ≤ 0, NaN, missing quote, unsupported currency, insufficient cash
- [ ] Returns `TradePreview` with `totalCad`, `estimatedCashAfterCad`, `quoteTimestamp`
- [ ] Stale-quote handling: callers can request quote refresh before preview

**Files Likely Affected**:
- `src/lib/trading/buy.ts`

---

#### T-016 Sell order validation + preview
**Size**: M | **Layer**: Backend | **Depends On**: T-012, T-013, T-014

**Description**: Validate ownership/quantity and compute proceeds + estimated realized G/L per PRD §10.2.

**Acceptance Criteria**:
- [ ] Rejects unowned asset, qty > owned, qty ≤ 0
- [ ] Returns `TradePreview` with `estimatedRealizedGainLossCad`
- [ ] If sell empties holding (≤ 0.000001), preview signals removal

**Files Likely Affected**:
- `src/lib/trading/sell.ts`

---

#### T-017 Apply trade → mutate portfolio
**Size**: M | **Layer**: Backend | **Depends On**: T-015, T-016

**Description**: Pure reducers that take `(portfolio, preview)` and return new portfolio + transaction + snapshot per PRD §10.1/§10.2 post-trade rules.

**Acceptance Criteria**:
- [ ] `applyBuy` updates cash, upserts holding with new average cost, appends transaction, appends snapshot
- [ ] `applySell` updates cash, decrements/removes holding, appends transaction with realized G/L, appends snapshot, increments `realizedGainLossCad`
- [ ] Functions are pure (no I/O, no `Date.now()` outside passed clock)

**Files Likely Affected**:
- `src/lib/trading/apply.ts`

---

### Chunk 6: State Store + Persistence
> T-018..T-020 — Zustand store wires together calc + trading modules; localStorage persistence is the MVP write path before Supabase lands.

#### T-018 Zustand simulator store
**Size**: M | **Layer**: Frontend | **Depends On**: T-006, T-017

**Description**: Implement `SimulatorStoreState` + actions + selectors from PRD §27.

**Acceptance Criteria**:
- [ ] Store exports actions: `initializeSimulation`, `loadState`, `saveState`, `resetSimulation`, `previewBuy`, `executeBuy`, `previewSell`, `executeSell`, `acknowledgeWarning`, etc.
- [ ] Store exports selectors from PRD §27.3
- [ ] Components never mutate state directly

**Files Likely Affected**:
- `src/store/simulatorStore.ts`

---

#### T-019 localStorage persistence layer
**Size**: M | **Layer**: Frontend | **Depends On**: T-018

**Description**: Save/load with key `personal-stock-simulator-v1`, schema-version field, validation, and corruption recovery per PRD §18.6.

**Acceptance Criteria**:
- [ ] Save triggers on every action listed in PRD §18.6
- [ ] `loadState()` validates `version` and shape; on failure, sets recovery flag
- [ ] No localStorage access in SSR paths (uses `typeof window` guard)

**Files Likely Affected**:
- `src/lib/persistence/localStorage.ts`

---

#### T-020 Reset simulation flow
**Size**: S | **Layer**: Frontend | **Depends On**: T-018, T-019

**Description**: `resetSimulation()` action clears holdings/transactions/warnings/snapshots, restores $5,000 CAD, keeps display name + market data mode per PRD §24.7. Supabase reset wired in T-061.

**Acceptance Criteria**:
- [ ] Cash returns to 5000.00
- [ ] Realized G/L returns to 0
- [ ] Initial snapshot inserted
- [ ] Display name + market data mode preserved

**Files Likely Affected**:
- `src/store/simulatorStore.ts`

---

### Chunk 7: App Shell & Navigation
> T-021..T-023 — Layout primitives shared by every page. Independent within chunk.

#### T-021 Design tokens + global styles
**Size**: S | **Layer**: Frontend | **Depends On**: T-001

**Description**: Apply design tokens from PRD §32 — colors, spacing, radii, shadows, button variants, table style.

**Acceptance Criteria**:
- [ ] Tailwind theme extended with semantic colors (success/danger/warning/info/accent/neutral)
- [ ] Light-mode-only base styles
- [ ] Tabular numerals utility class for financial numbers

**Files Likely Affected**:
- `tailwind.config.ts`, `src/app/globals.css`

---

#### T-022 AppShell + Header + SidebarNav + BottomNav
**Size**: M | **Layer**: Frontend | **Depends On**: T-021

**Description**: Responsive shell with sidebar (desktop) and bottom nav (mobile) per PRD §9.2 + §17.5.

**Acceptance Criteria**:
- [ ] Desktop sidebar shows: Dashboard, Browse, Portfolio, Learn, Compound, Settings
- [ ] Mobile bottom nav shows: Dashboard, Browse, Portfolio, Learn, More
- [ ] Header shows portfolio value and settings link
- [ ] Active nav item visually highlighted

**Files Likely Affected**:
- `src/components/layout/AppShell.tsx`, `Header.tsx`, `SidebarNav.tsx`, `BottomNav.tsx`, `src/app/layout.tsx`

---

#### T-023 Common UI primitives
**Size**: M | **Layer**: Frontend | **Depends On**: T-021

**Description**: Build `MetricCard`, `InfoTooltip`, `LearningLink`, `EmptyState`, `LoadingState`, `ErrorState`, `ConfirmModal`, `RiskPill`, `ReturnValue`, `CurrencyValue`, `PercentValue` from PRD §17.5.

**Acceptance Criteria**:
- [ ] `CurrencyValue` formats to 2 decimals with locale, supports CAD prefix
- [ ] `PercentValue` shows ± sign and color (success/danger)
- [ ] `LearningLink` resolves slug to `/learn/[slug]` outside modals; emits drawer event inside modals (drawer wired in T-046)
- [ ] All primitives are accessible (aria-labels, focus styles)

**Files Likely Affected**:
- `src/components/common/*.tsx`

---

### Chunk 8: Setup & Settings Pages
> T-024..T-025 — Two simple pages tied to the same store; can be done together.

#### T-024 First-launch setup page
**Size**: M | **Layer**: Frontend | **Depends On**: T-018, T-022

**Description**: Implement `/` (or `/setup`) per PRD §9.1. Optional display name; explains scope, disclaimer, starting balance; calls `initializeSimulation`.

**Acceptance Criteria**:
- [ ] Renders disclaimer, $5,000 CAD starting note, asset scope, exclusions
- [ ] Display name validated (length, allowed chars)
- [ ] `Start Simulation` initializes portfolio and routes to `/dashboard`
- [ ] If portfolio already exists, redirect to `/dashboard`

**Files Likely Affected**:
- `src/app/page.tsx`, `src/components/setup/SetupForm.tsx`

---

#### T-025 Settings page + reset flow
**Size**: M | **Layer**: Frontend | **Depends On**: T-020, T-022, T-023

**Description**: `/settings` per PRD §9.9 + §31.4. Display name, data mode toggle, simulation info, reset with confirmation modal.

**Acceptance Criteria**:
- [ ] Reset opens `ConfirmModal` explaining what clears vs persists
- [ ] On confirm, calls `resetSimulation` and navigates to `/dashboard`
- [ ] Data mode switch shows confirmation if holdings exist (PRD §31.5)
- [ ] Disclaimer block visible

**Files Likely Affected**:
- `src/app/settings/page.tsx`, `src/components/settings/*.tsx`

---

### Chunk 9: Browse + Asset Detail (mock-backed first)
> T-026..T-028 — Browse search and asset detail screens. Wired to store; will switch to real API in chunk 14.

#### T-026 Browse search bar + filters
**Size**: M | **Layer**: Frontend | **Depends On**: T-018, T-022

**Description**: `/browse` with `AssetSearchBar`, `AssetFilters` (Stocks/ETFs), and empty state per PRD §9.4 + §29.1.

**Acceptance Criteria**:
- [ ] Calls `searchAssets(query)` from store
- [ ] Empty state copy from PRD §30.2
- [ ] Filter toggles narrow results client-side

**Files Likely Affected**:
- `src/app/browse/page.tsx`, `src/components/browse/AssetSearchBar.tsx`, `AssetFilters.tsx`

---

#### T-027 Asset results table + row
**Size**: M | **Layer**: Frontend | **Depends On**: T-026

**Description**: Render results table with all PRD §29.1 columns (Symbol, Name, Type, Exchange, Currency, Price, Change %, Status, Action).

**Acceptance Criteria**:
- [ ] All required columns rendered
- [ ] `QuoteChangeBadge` shows daily change with semantic color
- [ ] Action button opens trade modal or navigates to `/asset/[symbol]`
- [ ] Loading + error states from PRD §30.2

**Files Likely Affected**:
- `src/components/browse/AssetResultsTable.tsx`, `AssetResultRow.tsx`, `AssetTypeBadge.tsx`, `QuoteChangeBadge.tsx`

---

#### T-028 Asset detail page
**Size**: M | **Layer**: Frontend | **Depends On**: T-027

**Description**: `/asset/[symbol]` showing quote, daily change, last updated, CAD conversion, learning links, and Buy/Sell entry per PRD §9.5.

**Acceptance Criteria**:
- [ ] Renders all PRD §9.5 "Must Show" fields
- [ ] Shows historical chart placeholder (filled in T-044)
- [ ] Buy/Sell buttons open trade ticket from chunk 10
- [ ] Loading + error states from PRD §30.3

**Files Likely Affected**:
- `src/app/asset/[symbol]/page.tsx`, `src/components/asset/AssetDetailHeader.tsx`

---

### Chunk 10: Trade Modals
> T-029..T-031 — Buy/sell flows; sequential because confirmation modal wraps preview.

#### T-029 TradeTicket + TradePreview UI
**Size**: M | **Layer**: Frontend | **Depends On**: T-015, T-016, T-023

**Description**: Quantity input, estimated cost/proceeds, cash after trade, learning links, refresh-if-stale flow per PRD §31.1/§31.2.

**Acceptance Criteria**:
- [ ] Quantity input accepts up to 6 decimals
- [ ] Calls `previewBuy` / `previewSell`; shows updated estimate when price changes
- [ ] Inline error messages from PRD §30.5
- [ ] Learning links inside modal open drawer (T-046), do NOT clear input

**Files Likely Affected**:
- `src/components/trading/TradeTicket.tsx`, `TradePreview.tsx`

---

#### T-030 Buy confirmation modal
**Size**: M | **Layer**: Frontend | **Depends On**: T-029

**Description**: Buy modal per PRD §9.5 wireframe with risk warnings inline.

**Acceptance Criteria**:
- [ ] Shows price, FX, estimated cost, cash after
- [ ] Renders inline risk warnings via `RiskWarningInline` (warnings module wired in T-049)
- [ ] On confirm calls `executeBuy`; shows success/error state
- [ ] Cancel discards preview

**Files Likely Affected**:
- `src/components/trading/TradeConfirmationModal.tsx`, `RiskWarningInline.tsx`

---

#### T-031 Sell modal + owned position card
**Size**: M | **Layer**: Frontend | **Depends On**: T-029

**Description**: Sell modal per PRD §9.5 with owned/avg-cost summary and realized G/L estimate.

**Acceptance Criteria**:
- [ ] Shows owned qty, average cost, current price, estimated proceeds, est. realized G/L, remaining shares
- [ ] Validates qty ≤ owned
- [ ] On confirm calls `executeSell`

**Files Likely Affected**:
- `src/components/trading/SellModal.tsx`, `OwnedPositionCard.tsx`

---

### Chunk 11: Portfolio Page
> T-032..T-034 — Holdings/transaction UI built on store selectors.

#### T-032 Portfolio summary + holdings table
**Size**: M | **Layer**: Frontend | **Depends On**: T-018, T-023

**Description**: `/portfolio` summary cards + holdings table with PRD §29.2 columns.

**Acceptance Criteria**:
- [ ] Summary cards: Total, Cash, Invested, Return
- [ ] Holdings table renders all 13 columns from PRD §29.2
- [ ] Numeric columns right-aligned, tabular numerals
- [ ] Empty state from PRD §30.4
- [ ] Quote status chip per row

**Files Likely Affected**:
- `src/app/portfolio/page.tsx`, `src/components/portfolio/PortfolioSummaryCards.tsx`, `HoldingsTable.tsx`, `HoldingRow.tsx`

---

#### T-033 Transaction history table
**Size**: M | **Layer**: Frontend | **Depends On**: T-032

**Description**: All PRD §29.3 columns; sells show realized G/L, buys show `—`.

**Acceptance Criteria**:
- [ ] All 9 columns rendered
- [ ] Newest first
- [ ] Pagination or scroll handled if >50 rows

**Files Likely Affected**:
- `src/components/portfolio/TransactionHistoryTable.tsx`

---

#### T-034 Realized vs unrealized explainer + portfolio learning links
**Size**: S | **Layer**: Frontend | **Depends On**: T-009, T-032

**Description**: Inline explainer linking to learning terms (Portfolio, Cost Basis, Realized Gain, Allocation) per PRD §10.4 + §9.6.

**Acceptance Criteria**:
- [ ] Explainer card differentiates realized vs unrealized
- [ ] Each highlighted term renders as `LearningLink`
- [ ] Links open `/learn/[slug]` in same tab

**Files Likely Affected**:
- `src/components/portfolio/RealizedUnrealizedExplainer.tsx`

---

### Chunk 12: Internal API Routes — Search/Quote/FX
> T-035..T-037 — Vercel serverless proxies to Twelve Data. Each is independent. Build the shared API helper first.

#### T-035 Internal API helper + Twelve Data client
**Size**: M | **Layer**: Backend | **Depends On**: T-005

**Description**: Shared utility producing `ApiSuccess`/`ApiError` envelopes, normalized errors, server-only fetch wrapper for Twelve Data using `TWELVE_DATA_API_KEY`.

**Acceptance Criteria**:
- [ ] `apiOk(data, cached?)`, `apiError(code, message, details?)` helpers
- [ ] Twelve Data fetch helper enforces server-only key access
- [ ] Standard error code mapping (rate-limit → `RATE_LIMITED`, network → `NETWORK_ERROR`, etc.)
- [ ] Returns `cached: true` when served from cache (cache wired in T-039)

**Files Likely Affected**:
- `src/lib/market-data/twelveData/client.ts`, `src/lib/market-data/api/envelope.ts`

---

#### T-036 GET /api/market/search route
**Size**: M | **Layer**: Backend | **Depends On**: T-035

**Description**: Implement search route per PRD §26.1 — calls Twelve Data `symbol_search`, filters/normalizes to supported assets.

**Acceptance Criteria**:
- [ ] Empty query returns `ok: true, data: []`
- [ ] Filters to allowed exchanges (NASDAQ, NYSE, NYSE ARCA, TSX) and currencies (CAD, USD)
- [ ] Tags unsupported entries with `isSupported: false` and reason
- [ ] Maps Twelve Data errors to PRD §26.5 codes

**Files Likely Affected**:
- `src/app/api/market/search/route.ts`

---

#### T-037 GET /api/market/quote and /api/market/fx routes
**Size**: M | **Layer**: Backend | **Depends On**: T-035

**Description**: Quote route per PRD §26.2 (returns freshness label) + FX route per PRD §26.4 (CAD→CAD short-circuits to 1).

**Acceptance Criteria**:
- [ ] Quote returns full `QuoteResponseData` with `freshness`
- [ ] Quote returns `QUOTE_UNAVAILABLE` / `UNSUPPORTED_ASSET` cleanly
- [ ] FX `CAD→CAD` returns rate 1 without external call
- [ ] FX `USD→CAD` returns rate + freshness; on failure returns `FX_UNAVAILABLE`

**Files Likely Affected**:
- `src/app/api/market/quote/route.ts`, `src/app/api/market/fx/route.ts`

---

### Chunk 13: History Route + Cache Layer
> T-038..T-039 — Caching is shared infra; history route consumes it.

#### T-038 In-memory cache module
**Size**: M | **Layer**: Backend | **Depends On**: T-035

**Description**: Module-level TTL cache used by all market routes per PRD §14.5 — quote 2m, FX 15m, search 10m, history 30m.

**Acceptance Criteria**:
- [ ] `getCached(key)`, `setCached(key, value, ttlMs)` API
- [ ] Quote/FX/search/history routes all consult cache before Twelve Data
- [ ] Cache hits set `cached: true` in envelope
- [ ] Documented as best-effort (cold start may evict)

**Files Likely Affected**:
- `src/lib/market-data/cache.ts`, route files in `src/app/api/market/*`

---

#### T-039 GET /api/market/history route
**Size**: M | **Layer**: Backend | **Depends On**: T-038

**Description**: History route per PRD §26.3 with default `interval=1day`, `outputsize=30`.

**Acceptance Criteria**:
- [ ] Returns `points: HistoricalPricePoint[]`
- [ ] If <2 points returned, still `ok: true` (UI shows insufficient-data state)
- [ ] Cached for 30 minutes per PRD §14.5

**Files Likely Affected**:
- `src/app/api/market/history/route.ts`

---

### Chunk 14: Frontend Market-Data Client
> T-040..T-041 — Replace direct mock provider use with API-backed provider; wire mode toggle.

#### T-040 Frontend market-data provider abstraction
**Size**: M | **Layer**: Frontend | **Depends On**: T-008, T-036, T-037, T-039

**Description**: Implement `MarketDataProvider` interface with `TwelveDataProvider` (calls internal `/api/market/*`), `MockMarketDataProvider`, and `CachedMarketDataProvider` decorator per PRD §14.3 + §18.1.

**Acceptance Criteria**:
- [ ] All four interface methods implemented in both providers
- [ ] Frontend code never calls Twelve Data directly (lint or grep confirms)
- [ ] Provider selection driven by `marketDataMode` from store

**Files Likely Affected**:
- `src/lib/market-data/provider.ts`, `twelveDataProvider.ts`, `cachedProvider.ts`

---

#### T-041 Quote freshness UI + refresh strategy
**Size**: M | **Layer**: Frontend | **Depends On**: T-040, T-018

**Description**: Implement refresh strategy from PRD §16 — refresh on app load, on dashboard/portfolio open if older than 2 min, before trade confirm if stale; render `QuoteStatusBadge` everywhere quote is shown.

**Acceptance Criteria**:
- [ ] Holding rows show Fresh/Recent/Stale/Unavailable badge
- [ ] Asset detail refreshes on mount and before trade confirm
- [ ] Optional 2–5 min interval refresh while page open
- [ ] Stale-quote warning banner shown when applicable (PRD §30.4)

**Files Likely Affected**:
- `src/components/common/QuoteStatusBadge.tsx`, `src/store/simulatorStore.ts`, page-level effects

---

### Chunk 15: Charts
> T-042..T-044 — Chart.js integration. Independent within chunk.

#### T-042 Portfolio value chart
**Size**: M | **Layer**: Frontend | **Depends On**: T-018

**Description**: Line chart over `portfolio.snapshots` per PRD §16. Empty state when <2 snapshots.

**Acceptance Criteria**:
- [ ] Renders via react-chartjs-2 with semantic colors
- [ ] X-axis is timestamp, Y-axis is total value CAD
- [ ] Empty state from PRD §30.4
- [ ] Tooltip shows snapshot details

**Files Likely Affected**:
- `src/components/charts/PortfolioValueChart.tsx`

---

#### T-043 Sector allocation pie chart
**Size**: M | **Layer**: Frontend | **Depends On**: T-012, T-018

**Description**: Pie of current allocation per PRD §16 — includes cash slice and `Unknown` sector bucket.

**Acceptance Criteria**:
- [ ] Cash rendered as its own slice
- [ ] Missing sector → `Unknown`
- [ ] Legend includes labels + percentages (color-not-only requirement)

**Files Likely Affected**:
- `src/components/charts/SectorAllocationChart.tsx`

---

#### T-044 Asset detail historical chart
**Size**: M | **Layer**: Frontend | **Depends On**: T-039, T-040

**Description**: Line chart on `/asset/[symbol]` using `/api/market/history`.

**Acceptance Criteria**:
- [ ] Default interval `1day`, outputsize `30`
- [ ] Insufficient-data empty state when <2 points
- [ ] Loading + error states implemented

**Files Likely Affected**:
- `src/components/charts/AssetHistoryChart.tsx`

---

### Chunk 16: Learning Center
> T-045..T-047 — Pages + drawer behavior. Sequential within chunk.

#### T-045 Learning Center index page
**Size**: M | **Layer**: Frontend | **Depends On**: T-009, T-022

**Description**: `/learn` per PRD §9.7 — search, category tabs, term cards.

**Acceptance Criteria**:
- [ ] All 6 categories from PRD §9.7 rendered as tabs
- [ ] Search filters by title + simple definition
- [ ] Term cards link to `/learn/[slug]`
- [ ] Empty state from PRD §30.6

**Files Likely Affected**:
- `src/app/learn/page.tsx`, `src/components/learn/LearningSearch.tsx`, `LearningCategoryTabs.tsx`, `LearningTermCard.tsx`

---

#### T-046 Term detail page + in-modal drawer
**Size**: M | **Layer**: Frontend | **Depends On**: T-045

**Description**: `/learn/[slug]` per PRD §9.7 detail format; same component reused as right-side drawer when opened from trade modal per PRD §31.3.

**Acceptance Criteria**:
- [ ] Detail page renders Title, Simple definition, In the simulator, Why it matters, Example, Related terms
- [ ] Related-terms chips link to other slugs
- [ ] Drawer mode does not unmount trade modal or clear input
- [ ] 404 state when slug missing (PRD §30.6)

**Files Likely Affected**:
- `src/app/learn/[slug]/page.tsx`, `src/components/learn/LearningTermDetail.tsx`, `RelatedTerms.tsx`, `LearningDrawer.tsx`

---

#### T-047 Wire LearningLink across the app
**Size**: M | **Layer**: Frontend | **Depends On**: T-046

**Description**: Audit dashboard/portfolio/trade modal/compound pages for terms requiring inline learning links per PRD §9, §10.4, §13.

**Acceptance Criteria**:
- [ ] Portfolio page links: Portfolio, Cost Basis, Realized Gain, Allocation
- [ ] Trade modals link: Stock/ETF, Price, Fractional Shares, Realized vs Unrealized
- [ ] Compound page links: Compound Growth, Annual Return, Time Horizon
- [ ] Risk warnings link to relevant Learn slugs (handled in T-049)

**Files Likely Affected**:
- All page/component files containing teachable labels

---

### Chunk 17: Diversification + Risk
> T-048..T-050 — Score, warnings, lifecycle. Sequential.

#### T-048 Diversification module
**Size**: M | **Layer**: Backend | **Depends On**: T-012

**Description**: 0–100 score per PRD §12.1 + label per §12.2 + sector grouping helper.

**Acceptance Criteria**:
- [ ] Score function applies all penalties + bonuses from PRD §12.1
- [ ] Score clamped 0–100
- [ ] Label function returns one of the 5 PRD §12.2 labels
- [ ] Pure functions, unit testable

**Files Likely Affected**:
- `src/lib/diversification/index.ts`

---

#### T-049 Risk warning module
**Size**: M | **Layer**: Backend | **Depends On**: T-048

**Description**: Detect all PRD §12.3 triggers, build `RiskWarning` objects with severity + relatedLearningSlugs.

**Acceptance Criteria**:
- [ ] All 7 triggers from PRD §12.3 implemented
- [ ] Warnings include `relatedLearningSlugs` (e.g., `concentration-risk`)
- [ ] Pre-trade and post-trade evaluators distinct (PRD §24.10)
- [ ] Dedupe identical active warnings

**Files Likely Affected**:
- `src/lib/risk/index.ts`

---

#### T-050 Risk warning UI + lifecycle
**Size**: M | **Layer**: Frontend | **Depends On**: T-049, T-018

**Description**: Surface warnings in dashboard, trade modals, and warning history per PRD §24.10. Acknowledge action keeps warnings in history but inactive.

**Acceptance Criteria**:
- [ ] `LatestWarningCard` on dashboard
- [ ] `RiskWarningInline` in trade modals
- [ ] `acknowledgeWarning(id)` updates state
- [ ] Acknowledged warnings hidden from active list unless retriggered
- [ ] Each warning links to relevant learning term

**Files Likely Affected**:
- `src/components/dashboard/LatestWarningCard.tsx`, `src/components/trading/RiskWarningInline.tsx`, `src/store/simulatorStore.ts`

---

### Chunk 18: Compound Growth Tool
> T-051..T-052 — Pure tool with formula + chart.

#### T-051 Compound growth formula module
**Size**: S | **Layer**: Backend | **Depends On**: T-006

**Description**: Implement formula from PRD §13.2 with yearly data points for chart.

**Acceptance Criteria**:
- [ ] Returns total contributed, future value, growth from compounding, yearly data points
- [ ] Handles `r = 0` without divide-by-zero
- [ ] Tested for known inputs (e.g., $0 start, $200/mo, 7%, 40y → ~$525k)

**Files Likely Affected**:
- `src/lib/compound/index.ts`

---

#### T-052 Compound growth page + chart
**Size**: M | **Layer**: Frontend | **Depends On**: T-051, T-022

**Description**: `/compound-growth` per PRD §9.8 with input form, summary cards, dual-line chart, disclaimer, learning links.

**Acceptance Criteria**:
- [ ] Inputs: starting amount, monthly contribution, annual %, years
- [ ] Summary cards: Contributed, Future Value, Growth
- [ ] Dual-line Chart.js (contributions-only vs compounded)
- [ ] Disclaimer from PRD §13.4 visible
- [ ] LearningLinks: Compound Growth, Annual Return, Time Horizon

**Files Likely Affected**:
- `src/app/compound-growth/page.tsx`, `src/components/compound/*.tsx`, `src/components/charts/CompoundGrowthChart.tsx`

---

### Chunk 19: Supabase Schema
> T-053..T-055 — DB layer; sequential because RLS depends on tables.

#### T-053 Supabase project init + migrations
**Size**: M | **Layer**: Backend | **Depends On**: T-004

**Description**: Create Supabase project, set up `supabase/migrations` folder, write migration for all 7 tables per PRD §34.2–34.8.

**Acceptance Criteria**:
- [ ] Migration files create profiles, portfolios, holdings, transactions, portfolio_snapshots, risk_warnings, learning_progress
- [ ] All check constraints from PRD applied
- [ ] All recommended indexes created (PRD §34)
- [ ] Unique partial index `one_active_portfolio_per_user`
- [ ] Migration runs cleanly against fresh project

**Files Likely Affected**:
- `supabase/migrations/0001_initial_schema.sql`

---

#### T-054 Row Level Security policies
**Size**: M | **Layer**: Backend | **Depends On**: T-053

**Description**: Enable RLS + insert/select/update/delete policies on all 7 tables per PRD §34.9.

**Acceptance Criteria**:
- [ ] RLS enabled on all 7 tables
- [ ] Each table has 4 policies (read/insert/update/delete) keyed on `user_id = auth.uid()` (or `profiles.id = auth.uid()`)
- [ ] Test: anon role cannot read any user data
- [ ] Test: authenticated user A cannot read user B's data

**Files Likely Affected**:
- `supabase/migrations/0002_rls_policies.sql`

---

#### T-055 Generate database.types.ts
**Size**: S | **Layer**: Backend | **Depends On**: T-053

**Description**: Run `supabase gen types typescript` and commit `database.types.ts` per PRD §18.0.2.

**Acceptance Criteria**:
- [ ] `src/lib/supabase/database.types.ts` exists and matches schema
- [ ] Imported by Supabase clients
- [ ] Regeneration documented in README

**Files Likely Affected**:
- `src/lib/supabase/database.types.ts`

---

### Chunk 20: Supabase Auth + Clients
> T-056..T-058 — Sequential. Clients first, auth second, protection last.

#### T-056 Supabase client/server/middleware modules
**Size**: M | **Layer**: Backend | **Depends On**: T-055

**Description**: Per PRD §18.0.2, create browser client, SSR server client, middleware for cookie-bound sessions, and (optional) service-role client for system tasks.

**Acceptance Criteria**:
- [ ] `src/lib/supabase/client.ts` uses publishable key
- [ ] `src/lib/supabase/server.ts` uses cookies, importable by Server Components/Route Handlers
- [ ] `src/lib/supabase/middleware.ts` refreshes session
- [ ] `next.config.ts` middleware wired
- [ ] Service-role client throws if imported into client component (file-level guard or naming convention)

**Files Likely Affected**:
- `src/lib/supabase/{client,server,middleware,serviceRole}.ts`, `src/middleware.ts`

---

#### T-057 Auth flows — signup, login, logout, callback
**Size**: M | **Layer**: Frontend | **Depends On**: T-056, T-022

**Description**: Email/password signup + login UI, logout in header, `/auth/callback` route per PRD §18.0.1.

**Acceptance Criteria**:
- [ ] `/auth/login` page with sign-up + sign-in tabs
- [ ] `/auth/callback` route handles email confirmation
- [ ] Logout button in header clears session
- [ ] On first successful login: create profile row, create default portfolio with $5,000 cash if none exists
- [ ] Magic link flow optional but stubbed

**Files Likely Affected**:
- `src/app/auth/login/page.tsx`, `src/app/auth/callback/route.ts`, `src/components/auth/AuthForm.tsx`

---

#### T-058 Protected routes + auth-aware navigation
**Size**: M | **Layer**: Frontend | **Depends On**: T-057

**Description**: Middleware blocks unauthenticated access to dashboard/browse/portfolio/compound/settings; landing + Learn remain public per PRD §18.0.1.

**Acceptance Criteria**:
- [ ] Unauthenticated visit to `/dashboard` redirects to `/auth/login?redirect=/dashboard`
- [ ] Authenticated visit to `/auth/login` redirects to `/dashboard`
- [ ] `authSessionStatus` in store reflects LOADING/AUTHENTICATED/UNAUTHENTICATED
- [ ] Header shows user email + logout when authenticated

**Files Likely Affected**:
- `src/middleware.ts`, `src/store/simulatorStore.ts`, `src/components/layout/Header.tsx`

---

### Chunk 21: Supabase Persistence Sync
> T-059..T-061 — Replace localStorage-only writes with Supabase-as-truth + localStorage-as-cache.

#### T-059 Read sync — load portfolio from Supabase
**Size**: M | **Layer**: Integration | **Depends On**: T-056, T-018

**Description**: On login/app load, fetch active portfolio + holdings + transactions + snapshots + warnings; hydrate Zustand; treat localStorage as fallback only per PRD §18.5.

**Acceptance Criteria**:
- [ ] `syncFromSupabase()` populates store
- [ ] Supabase value wins over localStorage when both present
- [ ] Loading skeleton shown until first sync completes
- [ ] If offline, falls back to last localStorage snapshot with banner

**Files Likely Affected**:
- `src/store/simulatorStore.ts`, `src/lib/persistence/supabaseSync.ts`

---

#### T-060 Write sync — persist trades/snapshots/warnings to Supabase
**Size**: L | **Layer**: Integration | **Depends On**: T-059

**Description**: After every buy/sell/snapshot/warning, write to Supabase; update `syncStatus`; localStorage cache is updated after Supabase confirms per PRD §18.5 + §34.11.

**Acceptance Criteria**:
- [ ] Buy writes: portfolios update + holdings upsert + transactions insert + snapshot insert
- [ ] Sell writes: portfolios update + holdings update/delete + transactions insert + snapshot insert
- [ ] Warnings persisted on creation
- [ ] Learning progress upserted when term opened
- [ ] `syncStatus` cycles SYNCED → SYNCING → SYNCED (or ERROR)
- [ ] UI shows sync status badge with PRD §34.11 labels

**Files Likely Affected**:
- `src/store/simulatorStore.ts`, `src/lib/persistence/supabaseSync.ts`, `src/app/api/portfolio/sync/route.ts`

---

#### T-061 Reset sync to Supabase
**Size**: M | **Layer**: Integration | **Depends On**: T-060

**Description**: Reset clears Supabase rows per PRD §34.10 — keep profile/auth/display name/data mode; clear holdings/transactions/snapshots/warnings; reset cash + realized G/L; insert new initial snapshot.

**Acceptance Criteria**:
- [ ] Single transaction (or coordinated batch) performs all deletes + portfolio update
- [ ] Initial snapshot inserted
- [ ] Learning progress preserved (PRD §34.10)
- [ ] On success, store reset to clean state and user routed to `/dashboard`

**Files Likely Affected**:
- `src/store/simulatorStore.ts`, `src/lib/persistence/supabaseSync.ts`

---

### Chunk 22: Tests
> T-062..T-064 — Test pyramid. Unit first (cheapest), then integration, then E2E.

#### T-062 Unit tests — calculations + trading + diversification + compound
**Size**: L | **Layer**: Testing | **Depends On**: T-014, T-017, T-048, T-051

**Description**: Vitest/Jest unit tests covering PRD §21.1 list.

**Acceptance Criteria**:
- [ ] Buy validation, sell validation
- [ ] Average cost recalculation (multiple buys, partial sells)
- [ ] Realized + unrealized G/L
- [ ] Total portfolio value + total return
- [ ] Diversification score (each penalty + bonus)
- [ ] Compound growth formula (known sample inputs)
- [ ] localStorage serialize/deserialize round-trip
- [ ] Coverage ≥ 80% of `src/lib/`

**Files Likely Affected**:
- `tests/unit/**/*.test.ts`

---

#### T-063 Integration tests — store flows
**Size**: M | **Layer**: Testing | **Depends On**: T-019, T-020, T-040

**Description**: Test full store flows from PRD §21.2 against mock provider.

**Acceptance Criteria**:
- [ ] Start → buy → portfolio updates correctly
- [ ] Buy existing holding → average cost updates
- [ ] Partial sell → realized gain updates
- [ ] Full sell → holding removed
- [ ] Refresh (re-load) → state restored
- [ ] Reset → state cleared
- [ ] Mock-mode quote unavailable handled

**Files Likely Affected**:
- `tests/integration/**/*.test.ts`

---

#### T-064 E2E tests — critical user journeys
**Size**: L | **Layer**: Testing | **Depends On**: T-052, T-058, T-061

**Description**: Playwright E2E against deployed preview or local dev, covering PRD §21.3 + Supabase acceptance from §34.12.

**Acceptance Criteria**:
- [ ] First launch + signup + setup → dashboard
- [ ] Browse search → buy → portfolio reflects holding
- [ ] Sell flow → realized gain shown in transaction history
- [ ] Compound calc interaction
- [ ] Settings reset confirmation
- [ ] Learn page render + term detail
- [ ] Refresh page → state restored from Supabase
- [ ] Logged-in second device → portfolio matches

**Files Likely Affected**:
- `tests/e2e/**/*.spec.ts`, `playwright.config.ts`

---

## Dependency Graph

```
                                 ┌────────────────────────────────────────┐
                                 │  Chunk 1  Foundation                    │
                                 │  T-001 → T-002, T-003, T-004           │
                                 └────────────────────────────────────────┘
                                                    │
                          ┌─────────────────────────┴──────────────────────────┐
                          ▼                                                    ▼
            ┌──────────────────────────┐                       ┌─────────────────────────────┐
            │  Chunk 2  Types          │                       │  Chunk 3  Mock + Content     │
            │  T-005, T-006, T-007     │                       │  T-008, T-009, T-010         │
            └──────────────────────────┘                       └─────────────────────────────┘
                          │                                                    │
                          ▼                                                    │
            ┌──────────────────────────┐                                       │
            │  Chunk 4  Calc Modules   │                                       │
            │  T-011 → T-012,T-013,T-014│                                      │
            └──────────────────────────┘                                       │
                          │                                                    │
                          ▼                                                    │
            ┌──────────────────────────┐                                       │
            │  Chunk 5  Trading Module │                                       │
            │  T-015,T-016 → T-017     │                                       │
            └──────────────────────────┘                                       │
                          │                                                    │
                          ▼                                                    │
            ┌──────────────────────────┐                                       │
            │  Chunk 6  Store + Cache  │                                       │
            │  T-018 → T-019 → T-020   │                                       │
            └──────────────────────────┘                                       │
                          │                                                    │
                          ▼                                                    │
            ┌──────────────────────────┐                                       │
            │  Chunk 7  AppShell + UI  │                                       │
            │  T-021 → T-022, T-023    │                                       │
            └──────────────────────────┘                                       │
                          │                                                    │
                          ├──────────────────────┬─────────────────────────────┤
                          ▼                      ▼                             ▼
            ┌─────────────────────┐  ┌──────────────────────┐   ┌──────────────────────────┐
            │ Chunk 8 Setup/Sett. │  │ Chunk 9 Browse/Asset │   │ Chunk 12 API: search/qte │
            │ T-024, T-025        │  │ T-026,T-027,T-028    │   │ T-035 → T-036,T-037      │
            └─────────────────────┘  └──────────────────────┘   └──────────────────────────┘
                                              │                              │
                                              ▼                              ▼
                                  ┌──────────────────────┐    ┌────────────────────────────┐
                                  │ Chunk 10 Trade Modals│    │ Chunk 13 History + Cache   │
                                  │ T-029 → T-030, T-031 │    │ T-038 → T-039              │
                                  └──────────────────────┘    └────────────────────────────┘
                                              │                              │
                                              ▼                              ▼
                                  ┌──────────────────────┐    ┌────────────────────────────┐
                                  │ Chunk 11 Portfolio   │    │ Chunk 14 FE Market Client  │
                                  │ T-032,T-033,T-034    │    │ T-040 → T-041              │
                                  └──────────────────────┘    └────────────────────────────┘
                                              │                              │
                                              └──────────────┬───────────────┘
                                                             ▼
                                              ┌────────────────────────────┐
                                              │ Chunk 15 Charts            │
                                              │ T-042, T-043, T-044        │
                                              └────────────────────────────┘
                                                             │
                                                             ▼
                                              ┌────────────────────────────┐
                                              │ Chunk 16 Learning Center   │
                                              │ T-045 → T-046 → T-047      │
                                              └────────────────────────────┘
                                                             │
                                                             ▼
                                              ┌────────────────────────────┐
                                              │ Chunk 17 Diversif. + Risk  │
                                              │ T-048 → T-049 → T-050      │
                                              └────────────────────────────┘
                                                             │
                                                             ▼
                                              ┌────────────────────────────┐
                                              │ Chunk 18 Compound Growth   │
                                              │ T-051 → T-052              │
                                              └────────────────────────────┘
                                                             │
                                                             ▼
                                              ┌────────────────────────────┐
                                              │ Chunk 19 Supabase Schema   │
                                              │ T-053 → T-054, T-055       │
                                              └────────────────────────────┘
                                                             │
                                                             ▼
                                              ┌────────────────────────────┐
                                              │ Chunk 20 Auth + Clients    │
                                              │ T-056 → T-057 → T-058      │
                                              └────────────────────────────┘
                                                             │
                                                             ▼
                                              ┌────────────────────────────┐
                                              │ Chunk 21 Persistence Sync  │
                                              │ T-059 → T-060 → T-061      │
                                              └────────────────────────────┘
                                                             │
                                                             ▼
                                              ┌────────────────────────────┐
                                              │ Chunk 22 Tests             │
                                              │ T-062 → T-063 → T-064      │
                                              └────────────────────────────┘
```

## Phase Mapping (PRD §19 / §33)

| PRD Phase | Chunks |
|-----------|--------|
| **Phase 1 — Core Simulator** | Chunks 1–11 (foundation, types, mock data, calc, trading, store, shell, browse, trade modals, portfolio) |
| **Phase 2 — Market Data** | Chunks 12–14 (internal API routes, cache, frontend provider) |
| **Phase 3 — Analytics + Charts** | Chunk 15 (Chart.js) + analytics already covered in Chunks 4 + 11 |
| **Phase 4 — Learning + Risk + Compound** | Chunks 16–18 |
| **Supabase Integration (cross-cutting)** | Chunks 19–21 |
| **Testing** | Chunk 22 |

## Technical Notes

- **Source-of-truth rule** (PRD §18.5): Supabase is authoritative once authenticated. localStorage is a recovery cache. All write paths must go to Supabase first, then mirror to localStorage.
- **API key safety** (PRD §14.2): Never use `NEXT_PUBLIC_` prefix for `TWELVE_DATA_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY`. Frontend code must call only `/api/market/*`, never Twelve Data directly.
- **Average cost basis** (PRD §24.5): Partial sells do not change `averageCostCad`. Holdings auto-close when remaining qty ≤ `0.000001`.
- **Quote freshness** (PRD §16): Four states (FRESH ≤2m, RECENT ≤5m, STALE >5m, UNAVAILABLE). Refresh strategy is push-on-load + on-trade + optional interval — not WebSocket.
- **Risk warnings educate, never block** (PRD §12.3): Trade flow continues; warning is shown in modal and persisted to history.
- **Learning links inside modals** (PRD §31.3): Open right-side drawer, do NOT navigate. Trade input must be preserved.
- **Reset preserves** (PRD §24.7 + §34.10): display name, data mode, profile, auth user, learning progress. Clears: cash → 5000, realized G/L → 0, holdings, transactions, snapshots, warnings.
- **Light mode only** (PRD §24.11). No dark mode in MVP.
- **Out-of-scope reminders** (PRD §4.2 + §23): No teachers, classes, leaderboards, badges, exports, crypto, options, margin, shorting, real money, AI advice, quizzes, certificates, videos. Resist adding tasks for these.
