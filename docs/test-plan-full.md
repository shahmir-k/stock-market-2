# Personal Stock Market Simulator — Full Test Plan

**Purpose**: exhaustive coverage matrix for every feature in plan.md (the 4731-line PRD) plus every feature added since (backtest, learning drawer, sector map, holdings race fix, editorial rework). This is the operational source of truth for what "done" means at test time.

**Scope**: ~330 test cases across 7 layers. Updated 2026-05-16.

**Out of scope**: anything in PRD §4.2 or §23 (crypto, options, margin, leaderboards, AI advice, etc.). Their absence is correct — no tests are written to "verify they don't work."

---

## Status update (2026-05-16)

Closed all reachable automated gaps in this pass. Current counts:

| Suite | Files | Tests | Status |
|---|---:|---:|---|
| Unit (`tests/unit/`) | 14 | 147 | all passing |
| Integration (`tests/integration/`) | 5 | 19 | all passing |
| API routes (`tests/api/`) | 5 | 33 | all passing |
| Database audit (`supabase/audit.sql`) | 1 SQL script | 11 checks | runs via `mcp__supabase__execute_sql` against live project — verified: 25 RLS policies present, RLS enabled on all 7 user-data tables, holdings unique index present |
| E2E (`tests/e2e/`) | 2 | 11 specs | unauthenticated specs only — authenticated journeys need a pre-created test account (see `docs/test-plan.md` for the 18-journey manual walk) |
| **Automated total** | **27** | **199 tests + 11 SQL checks** | all green |
| Manual (`docs/test-plan.md` + `M-*` here) | — | ~95 | walk per release |

### New files this pass

- `tests/unit/risk.test.ts` (24) — all 7 PRD §12.3 triggers + novelWarnings dedupe
- `tests/unit/backtest.test.ts` (20) — lump-sum/DCA/portfolio + edge cases
- `tests/unit/selectors.test.ts` (9) — memoization regression for R-BUG-001
- `tests/unit/sectorMap.test.ts` (8) — R-BUG-007 regression
- `tests/unit/normalizeSearch.test.ts` (9) — R-BUG-003 regression
- `tests/unit/learning.test.ts` (10) — 30 terms + helpers
- `tests/unit/persistence.test.ts` (7) — localStorage round-trip (jsdom)
- `tests/integration/warningLifecycle.test.ts` (4) — R-BUG-005 regression
- `tests/integration/refreshIdempotence.test.ts` (2) — R-BUG-006 regression
- `tests/integration/resetPreservation.test.ts` (5) — PRD §24.7 rules
- `tests/integration/modeSwitch.test.ts` (3) — mode persistence
- `tests/api/{search,fx,quote,history,profile}.test.ts` (33)
- `tests/api/helpers.ts` — shared NextRequest builder
- `supabase/audit.sql` — schema + RLS audit
- `tests/e2e/{smoke,learn}.spec.ts` — landing, auth gate, learn pages
- `src/lib/market-data/cache.ts` — added `_clearCache()` test helper

### Regression coverage (R-BUG-*)

Every fixed bug now has at least one automated guard:

| Bug | What | Guard |
|---|---|---|
| R-BUG-001 | Dashboard infinite-render loop | `tests/unit/selectors.test.ts` — memoization stability |
| R-BUG-002 | Bootstrap race (StrictMode 409s) | Covered by `inFlightSync` Promise dedupe in store (manual verification still recommended in E2E) |
| R-BUG-003 | Search duplicate rows | `tests/unit/normalizeSearch.test.ts` + `tests/api/search.test.ts` |
| R-BUG-004 | Asset detail default mode before hydration | Covered indirectly by `tests/integration/modeSwitch.test.ts` — full E2E spec marked manual |
| R-BUG-005 | Risk warnings persisting all `fresh` not novel | `tests/unit/risk.test.ts` + `tests/integration/warningLifecycle.test.ts` |
| R-BUG-006 | Holdings duplication race | `tests/integration/refreshIdempotence.test.ts` + DB unique index `D-SCH-008` |
| R-BUG-007 | Sector "Unknown" (paid /profile) | `tests/unit/sectorMap.test.ts` + `tests/api/profile.test.ts` |
| R-BUG-008 | Holdings table "Unavailable" on mount | Verified indirectly via refresh idempotence; manual in J9 |
| R-BUG-009 | Sell button enabled with qty > owned | Covered by sell-preview unit tests + manual J7 |

### Running everything

```bash
npm test                # 199 unit + integration + API tests (Vitest)
npx playwright test     # 11 E2E specs (Playwright) — needs dev server + chromium
# Database audit:
#   open supabase/audit.sql and execute via Supabase SQL editor or:
#   mcp__supabase__execute_sql with each block
```

---

## How to use this document

1. **Filter by status** to find gaps to close: `✗` is the priority list.
2. **Filter by layer** when running a specific test pass (e.g., before a release: walk all `E-*` and `M-*`).
3. **Cross-reference** the **File** column to find the existing test or implementation.
4. **Update status** as you close gaps — flip `✗ gap` to `✓ tests/unit/foo.test.ts:42`.

### Status legend

| Symbol | Meaning |
|---|---|
| ✓ | Automated and passing |
| ⚠ | Partially automated (covers happy path, missing edge cases) |
| ☐ | Manual test exists in `docs/test-plan.md` (18-journey QA) |
| ✗ | Gap — no test exists yet |
| 🅡 | Regression test for a specific fixed bug |

### Test ID conventions

`<Layer>-<Feature>-<Number>` — e.g., `U-COST-003` = Unit test #3 in Cost Basis.

| Layer prefix | Meaning |
|---|---|
| `U` | Unit test (Vitest, pure functions) |
| `I` | Integration test (Vitest + store) |
| `A` | API route test (Vitest with mocked Twelve Data) |
| `D` | Database test (SQL via Supabase MCP) |
| `E` | End-to-end test (Playwright) |
| `M` | Manual / exploratory |
| `R` | Regression test for a specific fixed bug |
| `X` | Cross-cutting concern (a11y, perf, security, etc.) |

### Feature codes

`COST` cost basis · `POR` portfolio analytics · `TRD` trading flow · `RSK` risk warnings · `DIV` diversification · `FX` currency conversion · `CMP` compound growth · `BKT` backtest · `LRN` learning center · `API` API routes · `AUTH` authentication · `RLS` row-level security · `PROXY` route protection · `PERSIST` persistence · `STORE` state store · `UI` UI behavior · `CHART` charts · `MOTION` motion / animations · `THEME` design tokens · `A11Y` accessibility · `PERF` performance · `SEC` security · `MKTDATA` market data integration · `MOCK` mock provider

---

## Coverage matrix (high-level)

| Area | Unit | Integration | API | DB | E2E | Manual | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Cost basis | 8 | – | – | – | – | – | 8 |
| Portfolio analytics | 14 | 2 | – | – | – | 1 | 17 |
| Realized G/L | 6 | 3 | – | – | 1 | 1 | 11 |
| FX / currency | 12 | – | 6 | – | – | 2 | 20 |
| Trading flow | 18 | 8 | – | – | 4 | 4 | 34 |
| Risk warnings | 15 | 4 | – | – | 2 | 2 | 23 |
| Diversification | 8 | – | – | – | – | 1 | 9 |
| Compound growth | 6 | – | – | – | 1 | 1 | 8 |
| Backtest | 18 | – | 4 | – | 3 | 1 | 26 |
| Learning Center | 8 | – | – | – | 2 | 2 | 12 |
| API routes (search/quote/fx/history/profile) | – | – | 32 | – | – | – | 32 |
| Auth + route protection | – | – | – | – | 6 | 2 | 8 |
| Database schema + RLS | – | – | – | 18 | – | – | 18 |
| Persistence | 4 | 6 | – | 4 | 3 | 2 | 19 |
| Store selectors + memoization | 9 | – | – | – | – | – | 9 |
| Charts + treemap | 2 | – | – | – | – | 6 | 8 |
| UI states (loading/empty/error) | – | – | – | – | – | 24 | 24 |
| Motion + reduced-motion | – | – | – | – | – | 4 | 4 |
| Editorial rework | – | – | – | – | – | 9 | 9 |
| Accessibility | – | – | – | – | – | 12 | 12 |
| Performance | – | – | – | – | – | 5 | 5 |
| Security (no key leaks) | – | – | 2 | – | – | 3 | 5 |
| Regressions (fixed bugs) | 5 | 2 | – | 2 | – | – | 9 |
| **Totals** | **133** | **25** | **44** | **24** | **22** | **80** | **328** |

---

## Section 1 · Unit tests (Vitest)

Pure functions, math, formula correctness. Fast (<3s for the suite). Run with `npm test`.

### 1.1 · Cost basis (`src/lib/calculations/costBasis.ts`)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-COST-001 | `recalcAverageCost(0, 0, 1, 100)` first purchase | returns 100 | ✓ | `tests/unit/costBasis.test.ts:11` |
| U-COST-002 | `recalcAverageCost(1, 100, 1, 120)` PRD §28.2 example | returns 110 | ✓ | `tests/unit/costBasis.test.ts:15` |
| U-COST-003 | `recalcAverageCost(2, 50, 3, 100)` weighted | returns 80 | ✓ | `tests/unit/costBasis.test.ts:19` |
| U-COST-004 | `recalcAverageCost(1, 100, 0, 120)` throws on qty=0 | throws | ✓ | `tests/unit/costBasis.test.ts:23` |
| U-COST-005 | `recalcAverageCost(1, 100, -1, 120)` throws on neg qty | throws | ✓ | `tests/unit/costBasis.test.ts:23` |
| U-COST-006 | `costBasis(2, 100)` | returns 200 | ✓ | `tests/unit/costBasis.test.ts:30` |
| U-COST-007 | `isHoldingClosed(1e-7)` epsilon boundary | true | ✓ | `tests/unit/costBasis.test.ts:36` |
| U-COST-008 | `isHoldingClosed(2e-6)` above epsilon | false | ✗ gap | — |

### 1.2 · Portfolio analytics (`src/lib/calculations/portfolio.ts`)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-POR-001 | `holdingMarketValue(qty=2, price=110)` | 220 | ✓ | `tests/unit/portfolio.test.ts:35` |
| U-POR-002 | `holdingUnrealizedGainLoss({2@100→110})` | 20 | ✓ | `tests/unit/portfolio.test.ts:38` |
| U-POR-003 | `holdingUnrealizedGainLossPercent({2@100→110})` | 10% | ✓ | `tests/unit/portfolio.test.ts:43` |
| U-POR-004 | `holdingUnrealizedGainLossPercent({qty=0})` zero cost | returns 0, no NaN | ✓ | `tests/unit/portfolio.test.ts:50` |
| U-POR-005 | `investedValueCad` sums all holdings | sum | ✓ | `tests/unit/portfolio.test.ts:56` |
| U-POR-006 | `investedValueCad` returns 0 for empty array | 0 | ✗ gap | — |
| U-POR-007 | `portfolioValueCad(cash, holdings)` = cash + invested | sum | ✓ | `tests/unit/portfolio.test.ts:65` |
| U-POR-008 | `totalReturnCad` PRD example 5300/5000 → +300 | 300 | ✓ | `tests/unit/portfolio.test.ts:69` |
| U-POR-009 | `totalReturnPercent` PRD example → 6% | 6 | ✓ | `tests/unit/portfolio.test.ts:69` |
| U-POR-010 | `totalReturnPercent` when starting=0 | 0, no division | ✓ | `tests/unit/portfolio.test.ts:74` |
| U-POR-011 | `unrealizedGainLossTotalCad` sums all | sum | ✓ | `tests/unit/portfolio.test.ts:78` |
| U-POR-012 | `holdingAllocationPercent` | h.value/total*100 | ✓ | `tests/unit/portfolio.test.ts:89` |
| U-POR-013 | `cashAllocationPercent` | cash/total*100 | ✓ | `tests/unit/portfolio.test.ts:92` |
| U-POR-014 | Allocation returns 0 when total=0 | no NaN | ✓ | `tests/unit/portfolio.test.ts:95` |
| U-POR-015 | `sectorBreakdownCad` groups by sector | map keyed by sector | ✓ | `tests/unit/portfolio.test.ts:102` |
| U-POR-016 | `sectorBreakdownCad` uses 'Unknown' for missing sector | "Unknown" key | ✓ | `tests/unit/portfolio.test.ts:102` |
| U-POR-017 | Negative G/L is reported correctly (loss case) | negative number | ✗ gap | — |

### 1.3 · Realized G/L (`src/lib/calculations/realizedGainLoss.ts`)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-RGL-001 | Sell above avg cost | positive | ✓ | `tests/unit/realizedGainLoss.test.ts:6` |
| U-RGL-002 | Sell below avg cost | negative | ✓ | `tests/unit/realizedGainLoss.test.ts:10` |
| U-RGL-003 | Sell at avg cost | zero | ✓ | `tests/unit/realizedGainLoss.test.ts:14` |
| U-RGL-004 | Throws on qty ≤ 0 | throws | ✓ | `tests/unit/realizedGainLoss.test.ts:18` |
| U-RGL-005 | PRD example qty=1, sell=130, avg=110 → +20 | 20 | ✗ gap | — |
| U-RGL-006 | Fractional qty (qty=0.5) | proportional | ✗ gap | — |

### 1.4 · Currency / FX (`src/lib/currency/index.ts`)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-FX-001 | `toCad(100, 'CAD', any)` passes through | 100 | ✓ | `tests/unit/currency.test.ts:12` |
| U-FX-002 | `toCad(100, 'USD', 1.35)` multiplies | 135 | ✓ | `tests/unit/currency.test.ts:16` |
| U-FX-003 | `toCad(100, 'USD', null)` throws FxUnavailableError | throws | ✓ | `tests/unit/currency.test.ts:19` |
| U-FX-004 | `fromCad(135, 'USD', 1.35)` inverse | 100 | ✓ | `tests/unit/currency.test.ts:25` |
| U-FX-005 | `fromCad(100, 'CAD', any)` passes | 100 | ✗ gap | — |
| U-FX-006 | `assertFxAvailable('CAD', null)` no-op | passes | ✓ | `tests/unit/currency.test.ts:31` |
| U-FX-007 | `assertFxAvailable('USD', null)` throws | throws | ✓ | `tests/unit/currency.test.ts:34` |
| U-FX-008 | `assertFxAvailable('USD', NaN)` throws | throws | ✓ | `tests/unit/currency.test.ts:34` |
| U-FX-009 | `assertFxAvailable('USD', 0)` throws | throws | ✓ | `tests/unit/currency.test.ts:34` |
| U-FX-010 | `assertFxAvailable('USD', -1)` throws | throws | ✗ gap | — |
| U-FX-011 | `getFxRateOrNull('CAD', any)` returns 1 | 1 | ✓ | `tests/unit/currency.test.ts:43` |
| U-FX-012 | `getFxRateOrNull('USD', 1.35)` returns 1.35 | 1.35 | ✓ | `tests/unit/currency.test.ts:46` |

### 1.5 · Trading flow — pure (`src/lib/trading/{buy,sell,apply}.ts`)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-TRD-001 | `buildBuyPreview` rejects qty ≤ 0 | throws | ✓ | `tests/unit/trading.test.ts:32` |
| U-TRD-002 | `buildBuyPreview` rejects NaN qty | throws | ✗ gap | — |
| U-TRD-003 | `buildBuyPreview` rejects insufficient cash | throws | ✓ | `tests/unit/trading.test.ts:43` |
| U-TRD-004 | `buildBuyPreview` populates totalCad + cashAfter | correct | ✓ | `tests/unit/trading.test.ts:54` |
| U-TRD-005 | `buildBuyPreview` carries quoteTimestamp | matches input | ✗ gap | — |
| U-TRD-006 | `buildSellPreview` rejects unowned asset | throws | ✓ | `tests/unit/trading.test.ts:156` |
| U-TRD-007 | `buildSellPreview` rejects qty > owned | throws | ✓ | `tests/unit/trading.test.ts:156` |
| U-TRD-008 | `buildSellPreview` populates estRealizedGL | correct | ✗ gap | — |
| U-TRD-009 | `applyBuy` creates new holding | qty correct, cash debited | ✓ | `tests/unit/trading.test.ts:67` |
| U-TRD-010 | `applyBuy` updates avg cost on add | blended | ✓ | `tests/unit/trading.test.ts:85` |
| U-TRD-011 | `applyBuy` appends transaction | length + 1 | ✓ | `tests/unit/trading.test.ts:67` |
| U-TRD-012 | `applyBuy` appends snapshot | length + 1 | ✓ | `tests/unit/trading.test.ts:67` |
| U-TRD-013 | `applyBuy` is pure (no Date.now() outside clock) | deterministic | ✗ gap | — |
| U-TRD-014 | `applySell` partial: avg cost unchanged | same | ✓ | `tests/unit/trading.test.ts:107` |
| U-TRD-015 | `applySell` partial: qty decremented | correct | ✓ | `tests/unit/trading.test.ts:107` |
| U-TRD-016 | `applySell` partial: realized G/L incremented | sum | ✓ | `tests/unit/trading.test.ts:107` |
| U-TRD-017 | `applySell` full: holding removed | length − 1 | ✓ | `tests/unit/trading.test.ts:134` |
| U-TRD-018 | `applySell` epsilon (1e-7 leftover): removes | length − 1 | ✗ gap | — |

### 1.6 · Risk warnings (`src/lib/risk/index.ts`)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-RSK-001 | Pre-trade: CONCENTRATION_SINGLE_STOCK fires at >50% | warning emitted | ✗ gap | — |
| U-RSK-002 | Pre-trade: doesn't fire at exactly 50% | empty | ✗ gap | — |
| U-RSK-003 | Pre-trade: NO_CASH_RESERVE fires at <1% cash | warning | ✗ gap | — |
| U-RSK-004 | Pre-trade: PANIC_SELLING fires at ≥5% below avg | warning | ✗ gap | — |
| U-RSK-005 | Post-trade: CONCENTRATION_SECTOR fires at >70% | warning | ✗ gap | — |
| U-RSK-006 | Post-trade: LACK_OF_DIVERSIFICATION when 1 holding | warning | ✗ gap | — |
| U-RSK-007 | Post-trade: OVERTRADING fires at >5 trades/day | warning | ✗ gap | — |
| U-RSK-008 | Post-trade: PERFORMANCE_CHASING fires on +5% buy | warning | ✗ gap | — |
| U-RSK-009 | `novelWarnings` filters out already-active dupes | filtered | ✗ gap 🅡 | — |
| U-RSK-010 | `novelWarnings` keeps acknowledged-then-retriggered | new warning kept | ✗ gap | — |
| U-RSK-011 | `dedupeWarnings` returns existing + novel | concatenated | ✗ gap | — |
| U-RSK-012 | Warning carries relatedLearningSlugs correctly | matches PRD §12.3 | ✗ gap | — |
| U-RSK-013 | Warning carries severity matching PRD §12.3 | matches | ✗ gap | — |
| U-RSK-014 | Warning has unique id (uuid v4) | unique | ✗ gap | — |
| U-RSK-015 | Empty portfolio returns no warnings | empty array | ✗ gap | — |

### 1.7 · Diversification (`src/lib/diversification/index.ts`)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-DIV-001 | Label boundaries map score → text | matches PRD §12.2 | ✓ | `tests/unit/diversification.test.ts:26` |
| U-DIV-002 | Single holding penalty (≥25 pts) | low score | ✓ | `tests/unit/diversification.test.ts:36` |
| U-DIV-003 | Broad ETF reward | high score | ✓ | `tests/unit/diversification.test.ts:43` |
| U-DIV-004 | Sector concentration penalty (>70% in one sector) | reduced score | ✗ gap | — |
| U-DIV-005 | No-cash-reserve penalty (<1% cash) | reduced score | ✗ gap | — |
| U-DIV-006 | Score clamped to [0, 100] | never negative or >100 | ✗ gap | — |
| U-DIV-007 | Empty portfolio (all cash) score | matches PRD §12.1 default | ✗ gap | — |
| U-DIV-008 | Score recomputes after holdings change | new score | ✗ gap | — |

### 1.8 · Compound growth (`src/lib/compound/index.ts`)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-CMP-001 | PRD §28.5: $0/$200/7%/40y → ~$525k | within ±$1000 | ✓ | `tests/unit/compound.test.ts:6` |
| U-CMP-002 | r=0 no divide-by-zero | future = contributions | ✓ | `tests/unit/compound.test.ts:17` |
| U-CMP-003 | Yearly point per year + initial | count = years + 1 | ✓ | `tests/unit/compound.test.ts:29` |
| U-CMP-004 | Starting amount + 0 monthly | grows from start | ✗ gap | — |
| U-CMP-005 | Negative return rate (-5%) | future < contributions | ✗ gap | — |
| U-CMP-006 | 1-year horizon (small N) | chart still renders | ✗ gap | — |

### 1.9 · Backtest math (`src/lib/backtest/index.ts`) — NEW

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-BKT-001 | `backtestLumpSum`: empty prices → zero summary | zeros | ✗ gap | — |
| U-BKT-002 | `backtestLumpSum`: dollars ≤ 0 → zero summary | zeros | ✗ gap | — |
| U-BKT-003 | `backtestLumpSum`: 2x growth (100→200) → +100 | gain = dollars, +100% | ✗ gap | — |
| U-BKT-004 | `backtestLumpSum`: −50% (100→50) → loss | gain = -dollars/2 | ✗ gap | — |
| U-BKT-005 | `backtestLumpSum`: CAGR over 5y constant growth | matches Math.pow | ✗ gap | — |
| U-BKT-006 | `backtestLumpSum`: unsorted prices sorted correctly | chronological | ✗ gap | — |
| U-BKT-007 | `backtestLumpSum`: startPrice ≤ 0 returns -100% | safe | ✗ gap | — |
| U-BKT-008 | `backtestDCA`: empty prices → zero | zeros | ✗ gap | — |
| U-BKT-009 | `backtestDCA`: contributes once per unique month | count = months | ✗ gap | — |
| U-BKT-010 | `backtestDCA`: skips contribution when price ≤ 0 | no purchase that day | ✗ gap | — |
| U-BKT-011 | `backtestDCA`: total contributed = months × monthly | exact | ✗ gap | — |
| U-BKT-012 | `backtestDCA`: CAGR uses avg-invested approximation | matches formula | ✗ gap | — |
| U-BKT-013 | `backtestLumpSumPortfolio`: empty legs → zero | zeros | ✗ gap | — |
| U-BKT-014 | `backtestLumpSumPortfolio`: allocations sum check is the caller's job | accepts any sum | ✗ gap | — |
| U-BKT-015 | `backtestLumpSumPortfolio`: 50/50 split equals avg of individual lumps | matches | ✗ gap | — |
| U-BKT-016 | `backtestLumpSumPortfolio`: forward-fills missing dates per leg | last known value used | ✗ gap | — |
| U-BKT-017 | `backtestLumpSumPortfolio`: legs with empty prices filtered out | excluded from total | ✗ gap | — |
| U-BKT-018 | `backtestLumpSumPortfolio`: union of dates is the timeline | every date appears | ✗ gap | — |

### 1.10 · Learning helpers (`src/lib/learning/index.ts`)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-LRN-001 | `getTermBySlug('average-cost')` returns the term | non-null | ✗ gap | — |
| U-LRN-002 | `getTermBySlug('unknown')` returns null | null | ✗ gap | — |
| U-LRN-003 | `getTermsByCategory('PORTFOLIO_BASICS')` returns array | non-empty | ✗ gap | — |
| U-LRN-004 | `searchTerms('average')` matches "Average Cost" | found | ✗ gap | — |
| U-LRN-005 | `searchTerms('')` returns all terms | length=30 | ✗ gap | — |
| U-LRN-006 | `getRelatedTerms` resolves relatedSlugs | array of LearningTerm | ✗ gap | — |
| U-LRN-007 | All 30 terms have non-empty body fields | no missing data | ✗ gap | — |
| U-LRN-008 | No `relatedSlugs` reference unknown slugs | all resolve | ✗ gap | — |

### 1.11 · Selectors + memoization (`src/store/simulatorStore.ts`)

These selectors are the ones that caused the infinite-loop bug fixed in J1.

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-SEL-001 | `memoOn` returns cached when key === lastKey | same ref | ✗ gap 🅡 | — |
| U-SEL-002 | `memoOn` recomputes when key changes | new ref | ✗ gap 🅡 | — |
| U-SEL-003 | `selectHoldingsWithAnalytics` returns stable ref | === across calls | ✗ gap 🅡 | — |
| U-SEL-004 | `selectRecentTransactions` returns stable ref | === across calls | ✗ gap 🅡 | — |
| U-SEL-005 | `selectActiveWarnings` returns stable ref | === | ✗ gap 🅡 | — |
| U-SEL-006 | `selectAcknowledgedWarnings` returns stable ref | === | ✗ gap 🅡 | — |
| U-SEL-007 | `selectDiversificationResult` returns stable ref | === | ✗ gap 🅡 | — |
| U-SEL-008 | Cache invalidates when underlying state changes | recompute | ✗ gap 🅡 | — |
| U-SEL-009 | `selectTotalReturnCad` matches calculation | matches `totalReturnCad()` | ✗ gap | — |

### 1.12 · Persistence (`src/lib/persistence/localStorage.ts`)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| U-PERSIST-001 | `saveToLocalStorage` then `loadFromLocalStorage` round-trip | equal | ✗ gap | — |
| U-PERSIST-002 | `loadFromLocalStorage` returns NotPresent on missing key | sentinel | ✗ gap | — |
| U-PERSIST-003 | `loadFromLocalStorage` returns Corrupted on bad JSON | sentinel | ✗ gap | — |
| U-PERSIST-004 | `loadFromLocalStorage` returns VersionMismatch on old version | sentinel | ✗ gap | — |

---

## Section 2 · Integration tests (Vitest + Zustand store)

Full store flows against mock provider. Verifies store actions trigger correct state cascade.

### 2.1 · Trade flows

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| I-TRD-001 | Start → buy AAPL → cash decreases, holding appears | matches | ✓ | `tests/integration/storeFlows.test.ts:21` |
| I-TRD-002 | Two buys at different prices → avg cost averages | blended | ✓ | `tests/integration/storeFlows.test.ts:43` |
| I-TRD-003 | Partial sell → avg cost stable, realized G/L incremented | matches | ✓ | `tests/integration/storeFlows.test.ts:63` |
| I-TRD-004 | Full sell → holding removed | length 0 | ✓ | `tests/integration/storeFlows.test.ts:82` |
| I-TRD-005 | Buy then immediate refresh → no duplicate holdings | length 1 | ✗ gap 🅡 | — |
| I-TRD-006 | Concurrent executeBuy calls don't double-charge cash | cash debited once | ✗ gap | — |
| I-TRD-007 | Failed Supabase persist still updates local state | local optimistic | ✗ gap | — |
| I-TRD-008 | After buy, syncStatus cycles SYNCING → SYNCED | observed | ✗ gap | — |

### 2.2 · Reset flow

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| I-RST-001 | Reset restores cash to 5000, clears holdings | matches | ✓ | `tests/integration/storeFlows.test.ts:100` |
| I-RST-002 | Reset preserves display name | unchanged | ✗ gap | — |
| I-RST-003 | Reset preserves market data mode | unchanged | ✗ gap | — |
| I-RST-004 | Reset clears warnings array | empty | ✗ gap | — |
| I-RST-005 | Reset appends new initial snapshot | length=1 | ✗ gap | — |
| I-RST-006 | Reset doesn't clear learning_progress (per PRD §34.10) | preserved | ✗ gap | — |

### 2.3 · Refresh quotes

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| I-REF-001 | `refreshHoldingQuotes` updates currentPrice/freshness | new values | ✗ gap | — |
| I-REF-002 | `refreshHoldingQuotes` backfills sector for unknown | sector populated | ✗ gap | — |
| I-REF-003 | `refreshHoldingQuotes` is idempotent under concurrent calls | one trip, no dupes | ✗ gap 🅡 | — |
| I-REF-004 | `refreshFxRate` populates fxRateUsdCad | numeric | ✗ gap | — |

### 2.4 · Warning lifecycle

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| I-RSK-INT-001 | Trade that triggers warning → warning added | length +1 | ✗ gap | — |
| I-RSK-INT-002 | Re-trade with same trigger → no duplicate (dedupe) | length unchanged | ✗ gap 🅡 | — |
| I-RSK-INT-003 | `acknowledgeWarning(id)` flips acknowledged=true | true | ✗ gap | — |
| I-RSK-INT-004 | Acknowledged warning re-fires after fresh trigger | new entry | ✗ gap | — |

### 2.5 · Mode switching

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| I-MODE-001 | `setMarketDataMode('MOCK')` persists in store | changes | ✗ gap | — |
| I-MODE-002 | After mode switch, `getQuote()` uses new provider | mock price | ✗ gap | — |
| I-MODE-003 | Mode switch persists to localStorage | rehydrates | ✗ gap | — |

### 2.6 · Persistence integration

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| I-PERSIST-001 | `loadState` rehydrates from localStorage | state matches | ✗ gap | — |
| I-PERSIST-002 | `loadState` prefers Supabase when both present | Supabase wins | ✗ gap | — |
| I-PERSIST-003 | `loadState` falls back to localStorage on Supabase error | local restored | ✗ gap | — |
| I-PERSIST-004 | Buy → state saved to localStorage immediately | observable | ✗ gap | — |
| I-PERSIST-005 | Reset clears localStorage | empty | ✗ gap | — |
| I-PERSIST-006 | Hydration finishes before child components render | `isHydrated=true` gate | ✗ gap | — |

---

## Section 3 · API route tests (Vitest with mocked Twelve Data)

Internal API routes act as the single boundary between the browser and Twelve Data. Tests should mock `twelveDataFetch` and verify envelope shape + error codes.

### 3.1 · `/api/market/search`

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| A-SRC-001 | Empty query returns `{ok:true, data:[]}` | empty array | ✗ gap | — |
| A-SRC-002 | Valid query returns normalized results | array of AssetSearchResult | ✗ gap | — |
| A-SRC-003 | Filters to supported exchanges (NASDAQ/NYSE/NYSE ARCA/TSX) | unsupported dropped | ✗ gap | — |
| A-SRC-004 | Filters to supported currencies (CAD/USD) | others dropped | ✗ gap | — |
| A-SRC-005 | Dedupes (symbol, exchange, currency) | unique only | ✗ gap 🅡 | — |
| A-SRC-006 | Cache hit returns `cached:true` envelope | flag set | ✗ gap | — |
| A-SRC-007 | Twelve Data 429 → `RATE_LIMITED` error code | code matches | ✗ gap | — |
| A-SRC-008 | Twelve Data 500 → `TWELVE_DATA_ERROR` | code matches | ✗ gap | — |
| A-SRC-009 | Network error → `NETWORK_ERROR` | code matches | ✗ gap | — |
| A-SRC-010 | Missing TWELVE_DATA_API_KEY → `UNKNOWN_ERROR` | code matches | ✗ gap | — |

### 3.2 · `/api/market/quote`

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| A-QUO-001 | Valid symbol returns full QuoteResponseData | freshness present | ✗ gap | — |
| A-QUO-002 | Freshness label correct for fresh quote | "FRESH" | ✗ gap | — |
| A-QUO-003 | Freshness label correct for stale quote (>5m) | "STALE" | ✗ gap | — |
| A-QUO-004 | Unsupported symbol → `UNSUPPORTED_ASSET` | code matches | ✗ gap | — |
| A-QUO-005 | Quote not found → `QUOTE_UNAVAILABLE` | code matches | ✗ gap | — |
| A-QUO-006 | Cache hit (within 2m TTL) | `cached:true` | ✗ gap | — |
| A-QUO-007 | Missing symbol param → `MISSING_QUERY` | code matches | ✗ gap | — |

### 3.3 · `/api/market/fx`

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| A-FX-001 | `from=CAD&to=CAD` short-circuits to rate=1, no upstream call | rate 1, no fetch | ✗ gap | — |
| A-FX-002 | `from=USD&to=CAD` returns rate + freshness | matches | ✗ gap | — |
| A-FX-003 | FX failure → `FX_UNAVAILABLE` | code matches | ✗ gap | — |
| A-FX-004 | Cache hit (within 15m TTL) | `cached:true` | ✗ gap | — |
| A-FX-005 | Unsupported `from` currency → error | error | ✗ gap | — |
| A-FX-006 | Missing `from`/`to` → `MISSING_QUERY` | code matches | ✗ gap | — |

### 3.4 · `/api/market/history`

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| A-HIS-001 | Default `outputsize=30` returns 30 points | length 30 | ✗ gap | — |
| A-HIS-002 | With `start_date`/`end_date` returns full range | many points | ✗ gap | — |
| A-HIS-003 | With `start_date` only, `end_date` defaults to today | points span | ✗ gap | — |
| A-HIS-004 | `interval != '1day'` → `UNSUPPORTED_ASSET` | code matches | ✗ gap | — |
| A-HIS-005 | Missing symbol → `MISSING_QUERY` | code matches | ✗ gap | — |
| A-HIS-006 | <2 points returned: `ok:true` with short array | `points.length < 2` | ✗ gap | — |
| A-HIS-007 | Cache key includes date range params | independent cache | ✗ gap | — |
| A-HIS-008 | Cache hit (within 30m TTL) | `cached:true` | ✗ gap | — |
| A-HIS-009 | History returns chronological (oldest first) | sorted ascending | ✗ gap | — |

### 3.5 · `/api/market/profile`

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| A-PRF-001 | Symbol in `sectorMap` returns sector immediately | hits map, no upstream | ✗ gap | — |
| A-PRF-002 | Symbol not in map but Twelve Data returns sector | sector populated | ✗ gap | — |
| A-PRF-003 | Twelve Data /profile 403 (paid-only) gracefully returns empty | `sector: undefined` | ✗ gap | — |
| A-PRF-004 | Cache hit (within 24h TTL) | `cached:true` | ✗ gap | — |
| A-PRF-005 | Missing symbol → `MISSING_QUERY` | code matches | ✗ gap | — |
| A-PRF-006 | All 60+ symbols in sectorMap return non-empty sector | every one | ✗ gap | — |

### 3.6 · Envelope + security (cross-route)

| ID | Test | Expected | Status | File |
|---|---|---|---|---|
| A-SEC-001 | API key never appears in any response body | not present | ✗ gap | — |
| A-SEC-002 | Routes set `cache: 'no-store'` upstream (no SWR caching) | header check | ✗ gap | — |

---

## Section 4 · Database tests (Supabase MCP `execute_sql`)

Schema, constraints, and Row Level Security. Run via `mcp__supabase__execute_sql` against the live project.

### 4.1 · Schema constraints

| ID | Test | Expected | Status |
|---|---|---|---|
| D-SCH-001 | `portfolios.starting_balance_cad` default = 5000 | DEFAULT 5000 | ✗ gap |
| D-SCH-002 | `portfolios.base_currency` check = 'CAD' | constraint enforced | ✗ gap |
| D-SCH-003 | `portfolios.market_data_mode` check IN ('API','MOCK') | enforced | ✗ gap |
| D-SCH-004 | `one_active_portfolio_per_user` partial unique index | INSERT 2nd active fails | ✗ gap |
| D-SCH-005 | `holdings.asset_type` check IN ('STOCK','ETF') | enforced | ✗ gap |
| D-SCH-006 | `holdings.native_currency` check IN ('CAD','USD') | enforced | ✗ gap |
| D-SCH-007 | `holdings.quantity` check ≥ 0 | enforced | ✗ gap |
| D-SCH-008 | `holdings` UNIQUE (portfolio_id, symbol) | INSERT dup fails | ✗ gap 🅡 |
| D-SCH-009 | `transactions.type` check IN ('BUY','SELL') | enforced | ✗ gap |
| D-SCH-010 | `risk_warnings.severity` check IN ('INFO','LOW','MEDIUM','HIGH') | enforced | ✗ gap |
| D-SCH-011 | `learning_progress` UNIQUE (user_id, term_slug) | INSERT dup fails | ✗ gap |
| D-SCH-012 | All FKs cascade on user delete | child rows removed | ✗ gap |

### 4.2 · RLS policies (per PRD §34.9)

| ID | Test | Expected | Status |
|---|---|---|---|
| D-RLS-001 | Anon role: `SELECT * FROM profiles` → 0 rows | empty | ✗ gap |
| D-RLS-002 | Anon role: `SELECT * FROM portfolios` → 0 rows | empty | ✗ gap |
| D-RLS-003 | Anon role: `SELECT * FROM holdings` → 0 rows | empty | ✗ gap |
| D-RLS-004 | Anon role: `SELECT * FROM transactions` → 0 rows | empty | ✗ gap |
| D-RLS-005 | Anon role: `SELECT * FROM portfolio_snapshots` → 0 rows | empty | ✗ gap |
| D-RLS-006 | Anon role: `SELECT * FROM risk_warnings` → 0 rows | empty | ✗ gap |
| D-RLS-007 | Anon role: `SELECT * FROM learning_progress` → 0 rows | empty | ✗ gap |
| D-RLS-008 | Authenticated user A: only own rows in every table | own only | ☐ J17 |
| D-RLS-009 | User A: UPDATE on user B's portfolio → 0 rows affected | silent fail | ☐ J17 |
| D-RLS-010 | User A: DELETE on user B's holding → 0 rows affected | silent fail | ✗ gap |
| D-RLS-011 | User A: INSERT into B's holdings (forge user_id) → blocked | check fails | ✗ gap |
| D-RLS-012 | profiles has no DELETE policy (cascade-only) | DELETE forbidden | ✗ gap |

---

## Section 5 · End-to-end tests (Playwright)

Tests run against the browser. Covers user-facing flows that integration tests can't reach.

| ID | Test | Status | File |
|---|---|---|---|
| E-AUTH-001 | First launch shows landing, click Sign in → /auth/login | ⚠ | `tests/e2e/smoke.spec.ts:13` |
| E-AUTH-002 | Sign up creates account, lands on /dashboard | ☐ J1 | — |
| E-AUTH-003 | Sign in with bad password → inline error | ✗ gap | — |
| E-AUTH-004 | Sign out → /auth/login | ☐ J2 | — |
| E-AUTH-005 | Deep-link to /portfolio while signed out → ?redirect preserved | ☐ J2 | — |
| E-AUTH-006 | Signed-in user hitting /auth/login → /dashboard | ☐ J2 | — |
| E-BROWSE-001 | Search "AAPL" → results visible, no console errors | ✓ | `tests/e2e/smoke.spec.ts:29` |
| E-TRD-001 | Click View → /asset/AAPL trade ticket loads | ✓ | `tests/e2e/smoke.spec.ts:29` |
| E-TRD-002 | Full buy → /portfolio reflects new holding | ☐ J5 | — |
| E-TRD-003 | Buy more of existing holding → avg cost blends | ☐ J6 | — |
| E-TRD-004 | Partial sell → realized G/L visible | ☐ J7 | — |
| E-TRD-005 | Full sell → holding disappears | ☐ J8 | — |
| E-RSK-001 | Concentration-trigger buy shows inline warning in modal | ☐ J11 | — |
| E-RSK-002 | Acknowledge warning on dashboard → next warning surfaces | ☐ J11 | — |
| E-LRN-001 | Learning Center index renders 30 terms, 6 categories | ☐ J12 | — |
| E-LRN-002 | Click term → article page, related chips work | ☐ J12 | — |
| E-LRN-003 | Bad slug → custom in-shell 404 | ☐ J12 | — |
| E-LRN-004 | Inside trade modal, learning link opens drawer (no nav) | ☐ J13 | — |
| E-CMP-001 | Compound calc with defaults shows $96k/$525k/$429k | ☐ J15 | — |
| E-BKT-001 | Single-asset lump (AAPL 2021-05-16 $5k) returns plausible value | ✗ gap | — |
| E-BKT-002 | DCA single-asset returns expected contributed total | ✗ gap | — |
| E-BKT-003 | Portfolio backtest rejects allocation that doesn't sum to 100 | ✗ gap | — |
| E-SET-001 | Reset confirmation modal appears | ✓ | `tests/e2e/smoke.spec.ts:41` |
| E-SET-002 | Reset clears holdings + cash → $5000 | ☐ J14 | — |

---

## Section 6 · Manual / exploratory tests

Tests that need a human eye or live infrastructure. Walk these per release.

### 6.1 · UI states (per PRD §30)

For every page, verify all four states render correctly:

| ID | Page | States to verify | Status |
|---|---|---|---|
| M-UI-001 | Dashboard | Loading skeleton; empty (no trades); error; populated | ☐ |
| M-UI-002 | Browse | Empty (no query); searching; empty results; populated; rate-limited | ☐ |
| M-UI-003 | Asset detail | Loading quote; loaded; quote unavailable; chart insufficient data | ☐ |
| M-UI-004 | Portfolio | Empty (no holdings); populated; one holding (lack-of-div warning) | ☐ |
| M-UI-005 | Learn index | Default; search no-results; category filter active | ☐ |
| M-UI-006 | Learn detail | Loaded; bad slug 404 | ☐ |
| M-UI-007 | Compound | Defaults; 0% return edge; very long horizon | ☐ |
| M-UI-008 | Backtest | Idle; loading; result; error (rate limit / bad symbol) | ☐ |
| M-UI-009 | Settings | All sections render | ☐ |
| M-UI-010 | Auth | Sign in mode; sign up mode; email confirmation pending; error | ☐ |
| M-UI-011 | Trade modal | Pre-preview; with warning; with sell estimate; submitting; error | ☐ |
| M-UI-012 | Learning drawer | Opens with trade input preserved; close returns to modal | ☐ J13 |

### 6.2 · Sync status badge

| ID | Test | Expected | Status |
|---|---|---|---|
| M-SYNC-001 | After successful save: "Saved" with green breathing dot | visible | ☐ |
| M-SYNC-002 | During in-flight: "Saving" with info dot | visible | ☐ |
| M-SYNC-003 | After failure: "Save failed" with red dot, no breathing | visible | ☐ |
| M-SYNC-004 | Reduced-motion: dot doesn't breathe | static | ☐ |

### 6.3 · Quote freshness badge

| ID | Test | Expected | Status |
|---|---|---|---|
| M-FRESH-001 | Quote ≤2m old → "Fresh" success tone | visible | ☐ |
| M-FRESH-002 | Quote ≤5m → "Recent" info tone | visible | ☐ |
| M-FRESH-003 | Quote >5m → "Stale" warning tone | visible | ☐ |
| M-FRESH-004 | No quote → "No quote" / "Unavailable" danger tone | visible | ☐ |
| M-FRESH-005 | After hard refresh, freshness updates correctly | refreshed | ☐ |
| M-FRESH-006 | Mounted asset-detail page triggers a refresh | observed | ☐ |

### 6.4 · Mode toggle

| ID | Test | Expected | Status |
|---|---|---|---|
| M-MODE-001 | API → MOCK with 0 holdings: no confirmation | direct | ☐ |
| M-MODE-002 | API → MOCK with holdings: confirmation modal appears | modal | ☐ J18 |
| M-MODE-003 | Confirm switch: prices change to mock fixtures | observed | ☐ J18 |
| M-MODE-004 | Mode persists across page reloads | observed | ☐ J16 |
| M-MODE-005 | Mode is per-user (different users can have different modes) | independent | ☐ |

### 6.5 · Cross-device persistence

| ID | Test | Expected | Status |
|---|---|---|---|
| M-PERSIST-001 | Trade in browser A, reload browser B (same account) → trade visible | ☐ J16 | — |
| M-PERSIST-002 | Clear localStorage, reload → state rehydrates from Supabase | ☐ J16 | — |
| M-PERSIST-003 | Offline (kill Wi-Fi): trades fail gracefully, sync status = ERROR | ☐ | — |
| M-PERSIST-004 | Re-online: pending changes flush, status returns to SYNCED | ☐ | — |

### 6.6 · Network failure scenarios

| ID | Test | Expected | Status |
|---|---|---|---|
| M-NET-001 | Twelve Data rate-limit: app shows "rate limited" inline error | observed | ☐ |
| M-NET-002 | Twelve Data 500: quote shows "Unavailable" | observed | ☐ |
| M-NET-003 | FX endpoint down on USD asset: trade modal blocks with FX error | observed | ☐ |
| M-NET-004 | Stale quote at trade time: warning banner appears (PRD §30.4) | observed | ☐ |
| M-NET-005 | Supabase offline: app continues with localStorage cache | observed | ☐ |

### 6.7 · Mobile

| ID | Test | Expected | Status |
|---|---|---|---|
| M-MOB-001 | Floating glass-pill bottom nav visible on viewport <768px | visible | ☐ |
| M-MOB-002 | Sidebar nav hidden on mobile | hidden | ☐ |
| M-MOB-003 | Asset detail Editorial Split collapses to stacked | observed | ☐ |
| M-MOB-004 | Trade modal fits within `calc(100vw - 2rem)` | no overflow | ☐ |
| M-MOB-005 | Drawer fits within `calc(100vw - 2rem)` | no overflow | ☐ |

---

## Section 7 · Editorial rework — visual + behavior

Verifying the design system applies consistently across the app.

| ID | Test | Expected | Status |
|---|---|---|---|
| M-REW-001 | All pages use bone canvas `#FBFBFA` background | observed | ☐ |
| M-REW-002 | All numerical values render in Geist Mono with `.tabular` | observed | ☐ |
| M-REW-003 | All H1 page titles render in Newsreader serif | observed | ☐ |
| M-REW-004 | Eyebrow labels are uppercase 11px wide-tracking | observed | ☐ |
| M-REW-005 | No boxed `rounded-2xl border` cards remain (except modal bezel) | observed | ☐ |
| M-REW-006 | Wordmark "Stockletter · simulator" in header serif | observed | ☐ |
| M-REW-007 | Sidebar active state uses thin accent left-rule (no box) | observed | ☐ |
| M-REW-008 | Subtle film-grain overlay visible at 3.5% opacity | observed | ☐ |
| M-REW-009 | All buttons scale to 0.98 on `:active` | observed | ☐ |

---

## Section 8 · Charts (`src/components/charts/*`)

Visual + behavior verification of all chart components.

| ID | Test | Expected | Status |
|---|---|---|---|
| M-CHART-001 | PortfolioValueChart: empty state if <2 snapshots | placeholder text | ☐ |
| M-CHART-002 | PortfolioValueChart: ink burgundy line, accent-soft fill | observed | ☐ |
| M-CHART-003 | PortfolioValueChart: tooltip serif title + mono body | observed | ☐ |
| M-CHART-004 | SectorAllocationChart: stacked horizontal bar (not pie) | observed | ☐ |
| M-CHART-005 | SectorAllocationChart: cash slice present + neutral grey | observed | ☐ |
| M-CHART-006 | SectorAllocationChart: legend rows sorted descending | observed | ☐ |
| M-CHART-007 | AssetHistoryChart: 30-day line with hairline grid | observed | ☐ |
| M-CHART-008 | CompoundGrowthChart: dashed grey + solid accent overlay | observed | ☐ |
| M-CHART-009 | BacktestChart: same two-line treatment as Compound | observed | ☐ |
| M-CHART-010 | All charts respond to viewport resize | observed | ☐ |

---

## Section 9 · Accessibility (WCAG 2.1 AA)

Test with keyboard, screen reader, axe-core, Lighthouse.

| ID | Test | Expected | Status |
|---|---|---|---|
| X-A11Y-001 | Keyboard navigation: tab through all interactive elements on every page | reachable | ☐ |
| X-A11Y-002 | Focus ring visible on every focusable element (accent color) | visible | ☐ |
| X-A11Y-003 | Skip-to-content link or equivalent | present | ✗ gap |
| X-A11Y-004 | All buttons have accessible name | non-empty | ☐ |
| X-A11Y-005 | All form inputs have associated labels | linked | ☐ |
| X-A11Y-006 | All charts have aria-label / fallback text | present | ☐ |
| X-A11Y-007 | Color contrast ≥ 4.5:1 for body text | passing | ☐ |
| X-A11Y-008 | Color contrast ≥ 3:1 for large text | passing | ☐ |
| X-A11Y-009 | No information conveyed by color alone (e.g., G/L always has sign) | observed | ☐ |
| X-A11Y-010 | Dialog focus trap works (modal + drawer) | trapped | ☐ |
| X-A11Y-011 | Esc closes modal + drawer | observed | ☐ |
| X-A11Y-012 | Lighthouse a11y score ≥ 95 on Dashboard, Portfolio, Asset Detail | ≥95 | ☐ |

### 9.1 · Reduced motion

| ID | Test | Expected | Status |
|---|---|---|---|
| X-MOTION-001 | `prefers-reduced-motion: reduce` collapses all animations | static | ☐ |
| X-MOTION-002 | Breathing dot doesn't animate under reduced-motion | static | ☐ |
| X-MOTION-003 | Fade-up entrances render immediately | observed | ☐ |
| X-MOTION-004 | Modal/drawer transitions are instant | observed | ☐ |

---

## Section 10 · Performance

| ID | Test | Expected | Status |
|---|---|---|---|
| X-PERF-001 | Lighthouse performance ≥ 80 on Dashboard | ≥80 | ☐ |
| X-PERF-002 | First Contentful Paint < 1.5s on broadband | observed | ☐ |
| X-PERF-003 | Largest Contentful Paint < 2.5s | observed | ☐ |
| X-PERF-004 | Time to Interactive < 3.5s | observed | ☐ |
| X-PERF-005 | Bundle size delta after rework ≤ +30KB gzipped | check | ☐ |

---

## Section 11 · Security

| ID | Test | Expected | Status |
|---|---|---|---|
| X-SEC-001 | `TWELVE_DATA_API_KEY` doesn't appear in any client JS bundle | grep dist/ | ☐ |
| X-SEC-002 | `SUPABASE_SERVICE_ROLE_KEY` doesn't appear in any client JS bundle | grep dist/ | ☐ |
| X-SEC-003 | Browser → Twelve Data direct request prevented (network panel audit) | no direct call | ☐ |
| X-SEC-004 | Service role key never imported in `'use client'` files | grep src/ | ☐ |
| X-SEC-005 | RLS policies cover all 7 user-data tables | verified | ☐ |

---

## Section 12 · Regression suite (specific fixed bugs)

Every bug we identified and fixed gets a regression test, named for the bug.

| ID | Bug | Test guarantees | Status |
|---|---|---|---|
| R-BUG-001 | Dashboard infinite-render loop (selectors returning new arrays) | Render `/dashboard` w/ active warnings + populated holdings + recent trades → no "Maximum update depth exceeded" in console | ✗ gap |
| R-BUG-002 | Bootstrap race (StrictMode → 2× insert profile/portfolio → 409) | Mount AppShell twice in rapid sequence → 1 profile row, 1 portfolio row | ✗ gap |
| R-BUG-003 | Search duplicate rows (same listing twice from upstream) | Search "AAPL", confirm no two rows share (symbol, exchange, currency) | ✗ gap |
| R-BUG-004 | Asset detail using default mode before hydration | Open `/asset/AAPL` in MOCK mode (set in localStorage), reload → mock price shows, not API | ✗ gap |
| R-BUG-005 | Risk warnings persisting all `fresh`, not novel-only | Trade 3× same symbol triggering same warning → DB has exactly 1 active LACK_OF_DIVERSIFICATION | ✗ gap |
| R-BUG-006 | Holdings duplication race (THIS one, $580 phantom return) | Mount `/portfolio` twice in rapid sequence → holdings count unchanged, total return unchanged | ✗ gap |
| R-BUG-007 | Sector "Unknown" because Twelve Data /profile is paid | Profile endpoint hits sectorMap first; AAPL returns "Technology" even without TD /profile | ✗ gap |
| R-BUG-008 | Holdings table "Unavailable" freshness on /portfolio mount | Mount `/portfolio` → after hydration completes, holdings show real freshness (not "Unavailable") | ✗ gap |
| R-BUG-009 | Sell button enabled with qty > owned | Set qty > owned → Preview Sell button is disabled + inline error visible | ✗ gap |

---

## Appendix · Test fixtures + helpers

These are the canonical test data shapes used across the unit/integration suites.

### A.1 · Common fixtures

| Helper | Location | Notes |
|---|---|---|
| `makeInitialPortfolio()` | `src/lib/persistence/initialState.ts` | $5,000 starting portfolio |
| `mockQuote(symbol)` | `src/lib/market-data/mock/mockAssets.ts` | Deterministic, mulberry32-seeded |
| `mockHistory(symbol, days)` | `src/lib/market-data/mock/mockAssets.ts` | N-day deterministic history |
| `mockFx(from, to)` | `src/lib/market-data/mock/mockAssets.ts` | USD/CAD = 1.37 |

### A.2 · Coverage thresholds

- Unit + integration test coverage ≥ **85%** of `src/lib/`
- 100% of API routes have at least one success + one error path test
- 100% of risk triggers (7) have at least one positive + one negative test
- 100% of selectors using `memoOn` have a memoization stability test

### A.3 · CI gating recommendations

1. **PR check**: `npm test` (unit + integration), `npm run lint`, `npx tsc --noEmit`
2. **Pre-deploy**: full Playwright E2E suite + 18 user journeys from `docs/test-plan.md`
3. **Weekly**: Lighthouse on all main routes, axe-core a11y audit
4. **Per-release**: full manual exploratory walk of this document

---

## Definitions of "done"

A feature is **green** when:
- All `U-*` and `I-*` cases for that feature are ✓
- Its `E-*` happy path is ✓
- Its UI states (loading/empty/error) are ☐ verified
- Its risk warnings (if any) are ✓
- Any related regression case (`R-*`) is ✓

A release is **shippable** when:
- 100% of `R-*` (regression) is ✓ — no fixed bug regresses
- 100% of `D-RLS-*` is verified — security is gating
- 100% of `X-SEC-*` is verified — no key leaks
- ≥ 90% of `U-*` and `I-*` and `A-*` is ✓
- ≥ 80% of `E-*` is ✓
- All `M-*` for the routes that changed in this release have been walked
- Lighthouse a11y ≥ 95 on every redesigned page
