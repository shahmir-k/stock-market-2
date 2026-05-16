# Personal Stock Market Simulator — Feature Walkthrough

**Purpose**: a guided tour through every feature in the app, framed for a non-engineer (or anyone who wants to understand what was built without diving into code). Each feature has:

- **What it does** (user-facing)
- **Why it matters**
- **PRD reference** (the section of `plan.md` it satisfies)
- **Main files** (in case you want to verify or trace)
- **Notable behavior / tradeoffs**

The app is a single-user stock & ETF trading **simulator** — virtual money, real prices. Built per a 4,731-line PRD covering ~250 acceptance criteria across 35 sections.

---

## At a Glance

| | |
|---|---|
| **Stack** | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + Zustand + Chart.js |
| **Backend** | Supabase (Postgres + Auth + Row Level Security) + Twelve Data API for live prices |
| **Hosting target** | Vercel |
| **Scope** | Stocks & ETFs on NASDAQ / NYSE / NYSE ARCA / TSX. CAD-denominated. Educational only — no real money, no crypto/options/margin/shorting |
| **Starting capital** | $5,000 CAD virtual cash on signup |
| **Codebase size** | ~9,150 lines across 109 TypeScript / TSX files |
| **PRD coverage** | All 64 implementation tasks in `docs/tasks/personal-stock-simulator-tasks.md` are complete |
| **Test plan** | 18 end-to-end user journeys in `docs/test-plan.md`, all PASS |

---

## 1. Authentication & Onboarding

### 1.1 Landing page

**What**: The first screen a visitor sees. Shows the disclaimer, what the simulator is, and what's excluded.

**Why it matters**: Sets expectations up front — "this is virtual money for learning, not financial advice." Required by PRD §9.1 and the legal/educational framing throughout.

**PRD**: §9.1
**File**: `src/app/page.tsx`

**Behavior**:
- Discloses starting cash ($5,000 CAD), supported assets (Stocks & ETFs), and exclusions (crypto, options, margin, short selling)
- "Educational only — not financial advice" disclaimer is always visible
- Optional display name input
- "Start Simulation" → routes to `/dashboard` (which triggers the auth gate if the user isn't signed in)

### 1.2 Sign up / sign in / sign out

**What**: Email + password authentication backed by Supabase Auth.

**Why it matters**: Lets the same user pick up their portfolio from any device. Without auth, data would be trapped in one browser.

**PRD**: §18.0.1, §18.0.2
**Files**: `src/app/auth/login/page.tsx`, `src/app/auth/callback/route.ts`, `src/components/auth/AuthForm.tsx`, `src/lib/supabase/{client,server,middleware}.ts`

**Behavior**:
- Single page with tabbed Sign in / Sign up modes
- Email confirmation flow handled via `/auth/callback`
- Sign-out clears the session and redirects to a public route
- Header shows the user's email/display-name + logout button when signed in
- Deep-link preservation: if you try to visit `/portfolio` while logged out, you land on `/auth/login?redirect=/portfolio` and after sign-in go straight to `/portfolio` (not the default `/dashboard`)
- Signed-in users hitting `/auth/login` are bounced to `/dashboard` — no looping

### 1.3 Route protection

**What**: Pages requiring auth (`/dashboard`, `/browse`, `/portfolio`, `/asset/...`, `/compound-growth`, `/settings`) refuse to render without a valid session.

**Why it matters**: Privacy. No one should accidentally see another user's portfolio because they shared a URL.

**PRD**: §18.0.1
**File**: `src/proxy.ts` (Next.js 16 renamed the `middleware` convention to `proxy` — we follow the latest)

**Behavior**:
- Public routes: `/`, `/auth/login`, `/auth/callback`, `/learn`
- All other app routes are gated; unauthenticated requests get a 307 redirect to `/auth/login?redirect=<original>`
- If Supabase env vars aren't configured, gating is skipped entirely (localStorage-only mode for offline demos)

### 1.4 Portfolio bootstrap

**What**: On a user's first successful login, the system automatically creates their profile row and a starter portfolio with $5,000 cash.

**Why it matters**: Zero-friction onboarding — the user lands on the dashboard with a working portfolio, no setup wizard required.

**PRD**: §18.0.1, §34.10
**File**: `src/lib/persistence/supabaseSync.ts` (function `loadFromSupabase`)

**Behavior**:
- Uses `upsert` with `ignoreDuplicates` so React StrictMode's double-effect can't trip a primary-key conflict
- Concurrent calls deduped via a module-level Promise in `simulatorStore.ts` (`inFlightSync`)
- Initial portfolio snapshot is recorded so the value-over-time chart has at least one data point

---

## 2. Browse & Search

### 2.1 Search assets

**What**: A search box on `/browse` that returns matching stocks and ETFs from Twelve Data.

**Why it matters**: Discovery — the user has to be able to find the asset they want to buy.

**PRD**: §9.4, §26.1
**Files**: `src/app/(app)/browse/page.tsx`, `src/components/browse/AssetSearchBar.tsx`, `src/app/api/market/search/route.ts`

**Behavior**:
- Calls our internal `/api/market/search?q=...` route — the browser **never** touches Twelve Data directly (API key stays server-side per PRD §14.2)
- Empty query returns an empty state with a friendly prompt
- Results are deduplicated by `(symbol, exchange, currency)` — Twelve Data sometimes returns the same listing twice
- Filters to supported exchanges (NASDAQ, NYSE, NYSE ARCA, TSX) and currencies (CAD, USD)
- Unsupported asset types (crypto, options, futures) are silently dropped per PRD §4.2

### 2.2 Results table & filters

**What**: A tabular view of search results with All / Stocks / ETFs filter buttons.

**Why it matters**: Quick browsing. Visual scan of prices, change %, exchange.

**PRD**: §29.1
**File**: `src/components/browse/AssetResultsTable.tsx`

**Columns**: Symbol, Name, Type (badge), Exchange, Currency, Price, Change % (green/red badge), Action (View → /asset/SYMBOL)

---

## 3. Asset Detail

### 3.1 Asset detail page

**What**: A full page for one symbol showing quote, daily change, CAD-converted price, 30-day chart, and the buy/sell trade ticket.

**Why it matters**: The decision page — where the user investigates a single asset before pulling the trigger.

**PRD**: §9.5
**Files**: `src/app/(app)/asset/[symbol]/page.tsx`, `src/components/asset/AssetDetailClient.tsx`, `src/components/charts/AssetHistoryChart.tsx`

**Required fields rendered** (per PRD §9.5):
- Symbol, name, exchange, native currency
- Current price in native currency + CAD-converted equivalent
- Daily change ($ + %) with semantic color
- Last-updated timestamp
- Freshness badge: **Fresh** (≤2m), **Recent** (≤5m), **Stale** (>5m), **Unavailable**
- Historical 30-day line chart
- Inline learning links (Stock, ETF, Market Price, Fractional Shares)
- Buy and Sell buttons → opens the trade ticket

**Notable**: The page waits for the auth/data store to hydrate before fetching a quote, and re-fetches when the user toggles between API and Mock data modes. This was a real bug we fixed.

### 3.2 Trade ticket

**What**: The buy/sell controls inline on the asset detail page.

**Why it matters**: Lets the user enter quantity, see an estimated total in CAD, and confirm.

**PRD**: §10.1, §10.2, §31.1, §31.2
**File**: `src/components/trading/TradeTicket.tsx`

**Behavior**:
- Quantity input accepts up to 6 decimals (fractional shares supported per PRD §7.1)
- Shows live estimated total CAD and cash-after-trade
- Pre-validates sells (button disabled when qty > owned, plus inline error message)
- "Owned: N shares · Avg cost $X" reminder when in Sell mode
- Preview button opens the confirmation modal

---

## 4. Trade Flow

### 4.1 Buy confirmation modal

**What**: A dialog that shows the full breakdown before money moves.

**Why it matters**: Friction at the right moment. Educational value: shows price, FX rate, total CAD, cash-after, plus any inline risk warnings.

**PRD**: §9.5 (wireframe), §10.1, §31.2
**File**: `src/components/trading/TradeConfirmationModal.tsx`

**Shows**: Price, FX rate (if non-CAD), quantity, estimated cost, cash after trade, inline risk warnings (concentration, etc.), learning links, Cancel/Confirm buttons.

**Trade flow when confirmed**:
1. `applyBuy(portfolio, preview)` (pure function in `src/lib/trading/apply.ts`) returns new portfolio, transaction record, snapshot
2. Risk warnings are re-evaluated (`evaluatePostTradeWarnings` in `src/lib/risk/index.ts`)
3. Store state updates locally → immediate UI feedback
4. Writes pushed to Supabase: transaction insert, portfolio cash update, holdings sync, snapshot insert, only-novel warnings inserted
5. Sync status badge cycles: SYNCING → SYNCED (or ERROR with retry)

### 4.2 Sell modal (same component, Sell mode)

**What**: Same trade ticket but in Sell mode — shows your owned quantity, avg cost, current price, estimated proceeds, estimated realized G/L, remaining shares.

**Why it matters**: The realized G/L preview lets users see in real time what a sell will lock in.

**PRD**: §10.2, §24.5

**Average-cost accounting** (PRD §24.5):
- A partial sell does **not** change the holding's average cost — only quantity decreases
- A full sell (remaining qty ≤ `HOLDING_CLOSE_EPSILON = 1e-6`) removes the holding entirely
- Realized G/L formula (`src/lib/calculations/realizedGainLoss.ts`):
  `quantitySold × (sellPriceCad − averageCostCad)`

### 4.3 Average-cost cost-basis recalculation

**What**: When you buy more of a holding you already own, the average cost gets blended.

**Why it matters**: Required for accurate gain/loss tracking. Most beginners get this wrong; the simulator does it correctly.

**PRD**: §10.3
**File**: `src/lib/calculations/costBasis.ts` (function `recalcAverageCost`)

**Formula**: `((oldQty × oldAvg) + (addQty × addPrice)) / (oldQty + addQty)`

---

## 5. Portfolio Page

### 5.1 Summary cards

**What**: Four top-of-page KPI cards: Total Value, Cash, Invested, Return ($ and %).

**PRD**: §11, §29.2
**File**: `src/components/portfolio/PortfolioSummaryCards.tsx`

### 5.2 Holdings table

**What**: One row per held position with 13 columns.

**PRD**: §29.2
**File**: `src/components/portfolio/HoldingsTable.tsx`

**Columns**: Symbol, Name, Type, Sector, Qty, Avg Cost, Price, Value, G/L $, G/L %, Allocation %, Quote status badge, Action.

**On page load**, the system refreshes quotes for every holding (only after the store hydrates from Supabase) and backfills missing sectors via the profile lookup.

### 5.3 Sector allocation pie chart

**What**: A donut chart showing how the portfolio is split across sectors (with Cash as its own slice).

**Why it matters**: Visual reinforcement of the diversification concept.

**PRD**: §16
**File**: `src/components/charts/SectorAllocationChart.tsx`

**Behavior**:
- Cash is always shown as a separate slice
- Holdings without a known sector are bucketed under "Unknown" (PRD §16)
- Legend includes labels + percentages (not color-only — accessibility requirement)

### 5.4 Transaction history

**What**: Full chronological log of every buy and sell.

**PRD**: §29.3
**File**: `src/components/portfolio/TransactionHistoryTable.tsx`

**Columns**: Date/time, Type (BUY/SELL), Symbol, Qty, Price (Native), FX rate, Total CAD, Realized G/L (on sells, `—` on buys), Quote timestamp.
**Order**: newest first.

### 5.5 Realized vs Unrealized explainer

**What**: A small card distinguishing the two concepts with inline learning links.

**Why it matters**: Educational. A common point of confusion for beginners.

**PRD**: §10.4, §9.6
**File**: `src/components/portfolio/RealizedUnrealizedExplainer.tsx`

---

## 6. Dashboard (`/dashboard`)

### 6.1 KPI tiles + latest warning + next action

**What**: The home screen after sign-in. Shows portfolio value, return, cash, invested. A "Latest Warning / Tip" card surfaces the most recent active risk warning. A "Next Action" card nudges first-time users to browse.

**PRD**: §9.3
**File**: `src/app/(app)/dashboard/page.tsx`

### 6.2 Portfolio value chart

**What**: Line chart of total portfolio value over time, built from snapshots recorded after every trade.

**PRD**: §16
**File**: `src/components/charts/PortfolioValueChart.tsx`

Shows an empty state if there are fewer than 2 snapshots.

### 6.3 Recent trades

**What**: A short list (last 5) of the most recent transactions.

**File**: dashboard page uses `selectRecentTransactions` selector from `src/store/simulatorStore.ts`

---

## 7. Risk Warnings & Diversification

### 7.1 Seven risk triggers

**What**: The app watches the portfolio for seven specific risk patterns and surfaces them as non-blocking warnings.

**Why it matters**: Education without paternalism — the trade always goes through; the warning teaches.

**PRD**: §12.3, §24.10
**File**: `src/lib/risk/index.ts`

| Trigger | Severity | When it fires |
|---|---|---|
| `CONCENTRATION_SINGLE_STOCK` | HIGH | A single holding > 50% of portfolio |
| `CONCENTRATION_SECTOR` | MEDIUM | A single sector > 70% of portfolio |
| `LACK_OF_DIVERSIFICATION` | LOW | Only one holding owned |
| `NO_CASH_RESERVE` | MEDIUM | This buy would leave <1% cash |
| `OVERTRADING` | INFO | More than 5 trades in one day |
| `PANIC_SELLING` | MEDIUM | Sell when current price ≥5% below avg cost |
| `PERFORMANCE_CHASING` | INFO | Buy after a sharp recent rise |

Warnings are evaluated **before** the trade (so the user sees them in the confirmation modal) and **after** the trade (so they appear on the dashboard).

### 7.2 Warning lifecycle

**What**: Warnings persist to Supabase. Users can acknowledge them; acknowledged warnings stop showing in the "active" view but remain in history.

**PRD**: §24.10
**Files**: `src/store/simulatorStore.ts` (`acknowledgeWarning`), `src/lib/persistence/supabaseSync.ts` (`persistAcknowledgeWarning`)

**Notable**: Deduplication runs by `type + relatedSymbol`. We persist **only** novel warnings — if the same trigger fires again before the previous one is acknowledged, no new DB row is created. (This was a bug we fixed: previously every trade created duplicate `LACK_OF_DIVERSIFICATION` rows.)

### 7.3 Diversification score

**What**: A 0-100 score and a textual label.

**PRD**: §12.1, §12.2
**File**: `src/lib/diversification/index.ts`

**Calculation**: starts at 100, applies penalties for concentration (single-stock, sector), single-asset holding, no cash; adds bonuses for sector diversity and balanced allocation. Clamped 0-100.

---

## 8. Learning Center

### 8.1 30 educational terms across 6 categories

**What**: A built-in glossary of investing concepts.

**Why it matters**: The simulator isn't just a toy — it teaches as you use it.

**PRD**: §9.7, §28
**Files**: `src/content/learningTerms.ts` (the content), `src/app/(app)/learn/page.tsx` (index), `src/lib/learning/index.ts` (helpers)

**Categories**: Market Basics, Portfolio Basics, Gains and Losses, Risk and Diversification, Long-Term Investing, Simulator Concepts.

**Each term has**: title, category, simple definition, "In the simulator" (how the term applies here), "Why it matters", an example, related-term slugs (which become clickable chips on the detail page).

### 8.2 Term detail pages

**What**: Each term has its own page at `/learn/<slug>`.

**File**: `src/app/(app)/learn/[slug]/page.tsx`, `src/components/learn/LearningTermDetail.tsx`

**Bad slug → in-shell 404**: `/learn/not-a-real-term` shows a friendly empty state inside the app shell with a "Browse all terms" button (rather than the default Next.js 404 page). File: `src/app/(app)/learn/[slug]/not-found.tsx`.

### 8.3 Inline learning links

**What**: Throughout the app, terminology like "Average Cost", "Realized Gain/Loss", "Stock", "Fractional Shares", "Concentration Risk" is hyperlinked to the corresponding learning page.

**File**: `src/components/common/LearningLink.tsx`

### 8.4 Learning drawer (inside trade modal)

**What**: When you click a learning link inside the buy/sell confirmation modal, a side-panel drawer slides in with the term content. The trade modal stays mounted, and your quantity input is preserved.

**Why it matters**: Required by PRD §31.3 — interrupting the trade flow with a full navigation would frustrate users.

**Files**: `src/components/learn/LearningDrawer.tsx` (provider + drawer), `src/components/common/LearningLink.tsx` (context-aware behavior)

**Mechanism**: A React context (`LearningDrawerContext`). When `LearningLink` is rendered inside `LearningDrawerProvider` (which wraps the trade modal), clicks open the drawer instead of navigating. Outside the provider, the link navigates normally.

### 8.5 Progress tracking

**What**: When you view a term, the visit is recorded in Supabase (one row per `(user_id, term_slug)`).

**PRD**: §34.8
**Table**: `public.learning_progress`

---

## 9. Compound Growth Tool (Forward)

**What**: A forward-looking calculator: enter a starting amount, monthly contribution, expected annual return, and time horizon — see what compounding could produce.

**Why it matters**: The "time in the market" lesson. Reinforces the educational mission.

**PRD**: §9.8, §13.2, §13.4
**Files**: `src/app/(app)/compound-growth/page.tsx`, `src/components/compound/ForwardCompound.tsx`, `src/lib/compound/index.ts`, `src/components/charts/CompoundGrowthChart.tsx`

**Verified sanity check**: $0 start, $200/month, 7% return, 40 years → ~$525,000 (matches industry compound-interest calculators).
**Handles**: 0% return (no divide-by-zero), 1-year horizon, very long horizons.
**Includes**: Disclaimer per PRD §13.4 — "educational estimate, returns not guaranteed."

---

## 10. Backtest Tool (NEW — beyond PRD scope)

**What**: A "what would have happened" companion to the compound growth tool. Three sub-tabs:

1. **Single asset · lump sum** — "If I'd put $5,000 into AAPL on 2021-05-16, what would I have today?"
2. **Single asset · monthly DCA** — "If I'd put $200/month into AAPL since 2021-05-16, what would I have today?"
3. **Multi-asset · lump sum** — "If I'd split $5,000 across AAPL + MSFT (50/50) on 2021-05-16, what would I have today?"

**Why it matters**: The forward compound tool is hypothetical. The backtest uses **real historical prices** — students see the actual outcome of real market scenarios.

**Where**: A second tab on `/compound-growth` ("Backtest (Historical)") alongside the forward calculator. Same page, same nav.

**Files**:
- Math: `src/lib/backtest/index.ts` (`backtestLumpSum`, `backtestDCA`, `backtestLumpSumPortfolio`)
- UI: `src/components/compound/Backtest.tsx`, `BacktestSingleAsset.tsx`, `BacktestPortfolio.tsx`, `BacktestShared.tsx`
- Chart: `src/components/charts/BacktestChart.tsx`
- Backend: `src/app/api/market/history/route.ts` (extended with `start_date` / `end_date` params)

**Outputs**: Contributed total, Final value, Gain ($ and %), CAGR (Compound Annual Growth Rate), and a line chart with both contribution-over-time and portfolio-value-over-time curves.

**Verified results** (real data, 2021-05-16 → 2026-05-16):
- AAPL $5,000 lump sum → $5,393.34 (+7.89% CAGR)
- AAPL $200/month DCA → $20,116.53 from $12,200 contributed (+26.99% effective rate)
- 50/50 AAPL+MSFT $5,000 lump sum → $10,246.35 (+15.45% CAGR)

**Disclaimer**: Backtest results are labeled as educational; fees, taxes, and dividends are not modeled (transparent about limitations).

---

## 11. Settings & Reset

### 11.1 Display name

**What**: User can set/change their display name; appears in the header.

**PRD**: §9.9, §31.4
**File**: `src/app/(app)/settings/page.tsx`

### 11.2 Market data mode toggle

**What**: Switch between **API Data** (real prices via Twelve Data) and **Mock Data** (built-in deterministic fixtures for 16 assets — useful for demos and offline development).

**PRD**: §31.5
**Behavior**: If you switch while holdings exist, a confirmation modal warns that prices will change. The choice is persisted to Supabase.

### 11.3 Reset simulation

**What**: A "Danger Zone" button that clears trading state and starts fresh.

**Why it matters**: Lets users experiment without permanent consequences.

**PRD**: §24.7, §31.4, §34.10
**Files**: `src/store/simulatorStore.ts` (`resetSimulation`), `src/lib/persistence/supabaseSync.ts` (`resetPortfolioInSupabase`)

**What reset clears**: holdings, transactions, snapshots, warnings; cash → $5,000.00; realized G/L → $0.
**What reset preserves**: auth account, profile, display name, data mode, learning progress (PRD §34.10).
**UI safety**: A confirmation modal explains exactly what will and won't be cleared before the user commits.

---

## 12. Behind the Scenes

These sections describe the engineering plumbing that makes everything above work. Mostly invisible to the user but important for credibility.

### 12.1 Market data pipeline

**What**: All third-party market data flows through internal API routes; the browser never touches Twelve Data directly.

**Why it matters**: PRD §14.2 — the API key is a server-side secret. Exposing it would let anyone burn your rate-limit budget or impersonate the app.

**Files**:
- Internal routes: `src/app/api/market/{search,quote,fx,history,profile}/route.ts`
- Server-only Twelve Data client: `src/lib/market-data/twelveData/client.ts`
- Response normalization: `src/lib/market-data/twelveData/normalize.ts` (filters to supported exchanges/currencies, maps error codes)
- Provider abstraction: `src/lib/market-data/provider.ts` (swaps API ↔ mock based on user setting)
- In-memory cache: `src/lib/market-data/cache.ts` (Quote 2m, FX 15m, Search 10m, History 30m, Profile 24h)

**Mock provider**: `src/lib/market-data/mock/mockProvider.ts` + `mockAssets.ts` — 16 deterministic-seeded assets covering NASDAQ, NYSE, NYSE ARCA, TSX. Lets demos work offline.

### 12.2 Supabase persistence (source of truth)

**What**: Supabase is the durable store. localStorage is a recovery cache.

**Why it matters**: PRD §18.5 — user data must survive a browser cache wipe; must follow them across devices.

**Files**:
- Clients: `src/lib/supabase/{client,server,middleware}.ts`
- Schema: `supabase/migrations/0001_initial_schema.sql` (7 tables)
- Persistence layer: `src/lib/persistence/{supabaseSync,localStorage,initialState}.ts`
- Types: `src/lib/supabase/database.types.ts` (kept hand-written to preserve literal-union enums)

**Tables** (PRD §34.2–34.8):
1. `profiles` — display name + timestamps
2. `portfolios` — cash, realized G/L, starting balance, market_data_mode
3. `holdings` — one row per open position (qty, avg_cost_cad, prices, sector, freshness)
4. `transactions` — append-only ledger of every buy/sell
5. `portfolio_snapshots` — point-in-time portfolio values (for the value-over-time chart)
6. `risk_warnings` — every warning ever generated (with acknowledged flag)
7. `learning_progress` — which terms the user has viewed

### 12.3 Row-Level Security (RLS)

**What**: At the database level, every query is filtered by `user_id = auth.uid()`. Even with a stolen API key, you can only see your own data.

**Why it matters**: Defense in depth. App-level checks can be bypassed; database-level checks cannot.

**File**: `supabase/migrations/0002_rls_policies.sql`

**Verified at the wire during end-to-end testing**:
- Anonymous request → `[]` for every user-data table
- Authenticated User A querying for User B's holdings → `[]` (filtered, not denied — no information leak)
- User A attempting to update User B's portfolio → 0 rows affected (silent fail)

### 12.4 Sync status badge

**What**: A small "Saved / Syncing / Offline / Error" indicator in the header.

**PRD**: §34.11
**File**: `src/components/common/SyncStatusBadge.tsx`

Tells the user at a glance whether their last action made it to the server.

### 12.5 Quote freshness logic

**What**: Every quote carries a freshness label computed from the quote timestamp.

**PRD**: §16
**File**: `src/lib/market-data/api/freshness.ts`

**Thresholds**: Fresh ≤ 2 min, Recent ≤ 5 min, Stale > 5 min, Unavailable when no quote.

**Refresh strategy**: refresh on app load, on dashboard/portfolio mount, on asset detail mount, and before a trade confirms if the quote is stale.

---

## 13. Test Coverage

### 13.1 Automated tests

| Layer | Framework | Files | Count |
|---|---|---|---|
| Unit (math + pure functions) | Vitest | `tests/unit/*.test.ts` | 51 tests across 7 files |
| Integration (store flows) | Vitest | `tests/integration/storeFlows.test.ts` | Full buy → sell → reset cycle |
| End-to-end (browser) | Playwright | `tests/e2e/smoke.spec.ts` | Smoke flow |

### 13.2 Manual QA — 18 user journeys

**File**: `docs/test-plan.md`

Each journey has goal, preconditions, numbered steps, expected outcomes, pass/fail checkbox. Covers: signup, login, browse, asset detail, buy (golden path), buy-more cost basis recalc, partial sell, full sell, portfolio analytics, freshness, risk warnings, learning center, drawer-in-modal, settings, compound growth, persistence, RLS isolation, mock mode.

**All 18 PASS** as of the last walkthrough (2026-05-16).

---

## 14. What is NOT in the app (and that's intentional)

PRD §4.2 + §23 explicitly excluded the following from the MVP. Their absence is correct:

- **Crypto, options, margin, short selling** — only stocks & ETFs
- **Real money** — virtual cash only
- **AI advice / signal recommendations / sentiment scoring**
- **Multi-portfolio per user** — one active portfolio per user (enforced by a partial unique index in Postgres)
- **Teachers, classes, students, assignments, grading**
- **Leaderboards, badges, social features**
- **Dark mode** — light mode only (PRD §24.11)
- **Data export (CSV/PDF)**
- **Quizzes, certificates, video courses**

If your boss asks "why doesn't it do X?" — most likely the PRD ruled it out by design.

---

## 15. Known Limits & Future Considerations

### 15.1 Sector data is hand-curated

**What**: Twelve Data's `/profile` endpoint (which returns sector data) requires a paid plan ($29 USD/month).

**Workaround**: A hand-curated sector map in `src/lib/market-data/sectorMap.ts` covers ~60 of the most common symbols (Apple → Technology, etc.). Anything not in the map shows "Unknown".

**Fix paths**:
- (a) extend the map as new symbols come up,
- (b) upgrade Twelve Data,
- (c) integrate a free alternative like Finnhub's `/stock/profile2`.

### 15.2 Backtest doesn't model fees, taxes, or dividends

**Why**: Educational simplicity. Realistic modeling would require the user to specify a brokerage's fee schedule and tax bracket. Disclaimer is visible on the page.

### 15.3 Backtest portfolio mixes currencies naïvely

**Why**: For an MVP, summing native-currency values is easier than per-day FX conversion. The UI calls this out. Users get correct results when all legs share a currency.

### 15.4 Mock mode and search route in API mode

**Why**: When you flip to MOCK mode, `/api/market/search` (the browse search) is still hit, but the route is independent of the user's mode setting and always calls Twelve Data. The asset detail and portfolio views correctly use mock data. Not a user-visible bug since browse still returns the same results — but worth noting if mock mode is meant to be fully offline.

---

## 16. File-Layout Cheat Sheet

```
src/
  app/
    page.tsx                          Landing page
    auth/
      login/page.tsx                  Sign in / sign up
      callback/route.ts               Email confirmation callback
    (app)/
      layout.tsx                      AppShell wrapper (header, sidebar)
      dashboard/page.tsx              KPIs + warnings + recent trades
      browse/page.tsx                 Search stocks & ETFs
      asset/[symbol]/page.tsx         Asset detail + trade ticket
      portfolio/page.tsx              Holdings table + sector pie + tx history
      learn/
        page.tsx                      Learning Center index (30 terms)
        [slug]/page.tsx               Individual term detail
        [slug]/not-found.tsx          Custom in-shell 404
      compound-growth/page.tsx        Forward calculator + Backtest tabs
      settings/page.tsx               Display name, mode toggle, reset
    api/market/
      search/route.ts                 Twelve Data search proxy
      quote/route.ts                  Single quote
      fx/route.ts                     FX rates
      history/route.ts                Historical prices (with date range)
      profile/route.ts                Sector/profile lookup
  components/
    layout/                           AppShell, Header, Sidebar, BottomNav
    common/                           Buttons, badges, cards, tooltips, LearningLink
    browse/                           Search bar, results table, badges
    asset/                            AssetDetailClient
    trading/                          TradeTicket, ConfirmationModal, Sell modal
    portfolio/                        Summary cards, holdings table, tx table
    dashboard/                        Latest warning card, recent trades list
    charts/                           PortfolioValueChart, SectorAllocationChart,
                                      AssetHistoryChart, CompoundGrowthChart, BacktestChart
    learn/                            Term cards, term detail, LearningDrawer
    compound/                         ForwardCompound, Backtest, BacktestSingleAsset,
                                      BacktestPortfolio, BacktestShared
    setup/                            SetupForm (landing page)
    auth/                             AuthForm
    settings/                         Settings sub-components
  content/
    learningTerms.ts                  30 learning term records
  lib/
    calculations/                     Cost basis, portfolio analytics, realized G/L
    currency/                         FX conversion + FxUnavailableError
    trading/                          Buy/sell preview + apply (pure reducers)
    compound/                         Forward compound formula
    backtest/                         Historical backtest math
    diversification/                  Score + label
    risk/                             7 risk triggers + dedupe
    learning/                         Term lookup + category helpers
    market-data/
      provider.ts                     MarketDataProvider interface
      twelveDataProvider.ts           API-backed implementation
      mock/                           Deterministic fixture provider
      twelveData/                     Server-side fetch + normalize
      api/                            Envelope + freshness helpers
      cache.ts                        TTL cache
      sectorMap.ts                    Hand-curated sector lookup
    persistence/
      initialState.ts                 Default $5,000 portfolio
      localStorage.ts                 Recovery cache layer
      supabaseSync.ts                 Load + persist trades, warnings, holdings, reset
    supabase/
      client.ts, server.ts, middleware.ts    SSR-safe Supabase clients
      database.types.ts               Hand-written DB types (literal-union enums)
  store/
    simulatorStore.ts                 Zustand store: state + actions + selectors
  types/
    market.ts                         API envelope + quote/history/FX/profile shapes
    portfolio.ts                      Portfolio, Holding, Transaction, RiskWarning
    trading.ts                        Buy/sell inputs, TradePreview, TradeResult
    learning.ts                       LearningTerm, LearningCategory
    education.ts                      UI projection types for learn page
  proxy.ts                            Next.js 16 proxy (auth gate + session refresh)
supabase/
  migrations/
    0001_initial_schema.sql           7 tables
    0002_rls_policies.sql             25 RLS policies
docs/
  tasks/personal-stock-simulator-tasks.md   64 implementation tasks (all done)
  test-plan.md                              18 user journey QA checklist
  feature-walkthrough.md                    This document
plan.md                                     4,731-line PRD (source of truth)
```

---

## 17. Demo Script (suggested)

If you're showing this to your boss in 10 minutes, here's the order I'd suggest:

1. **Open landing page** (`/`) — read the disclaimer aloud; explain "virtual money, real prices, educational"
2. **Sign up** with a fresh email — show it instantly drops you on the dashboard with $5,000
3. **Browse → search "AAPL"** — note the 8-column results table, click through
4. **On the asset page**: point out the live USD price, the CAD conversion, the freshness badge, the historical chart
5. **Click Buy → set quantity 1 → Preview** — show the modal: price, FX, total CAD, cash after; click a learning link to demo the **drawer** without losing input
6. **Confirm Buy** — return to /portfolio, point out the new row, the transaction history, the cash decrease, the sector pie
7. **Buy 8 more shares** (deliberately to trigger concentration) — show the inline **risk warning** in the modal; emphasize it does NOT block the trade
8. **Back to dashboard** — show the warning card; click Acknowledge to demonstrate the lifecycle
9. **Open Learning Center** — search "average" → "Average Cost" → show the term detail with related-term chips
10. **Compound Growth → switch to Backtest tab** — run "AAPL $5,000 lump sum from 2021-05-16" — show the real-data outcome and the chart
11. **Settings → Reset Simulation** — point out the confirmation modal listing exactly what clears
12. **(Optional) Open Supabase dashboard in a tab** — show the row for this account, then run `SELECT * FROM portfolios` as anon — returns `[]`. RLS in action.

Total time: ~10 minutes. Covers the whole user journey + every major subsystem.
