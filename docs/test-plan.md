# Personal Stock Market Simulator MVP — Manual Test Plan

**Source of truth**: `plan.md` (PRD, 4731 lines) and `docs/tasks/personal-stock-simulator-tasks.md` (64 tasks).
**Scope**: Manual click-through QA in a browser against `http://localhost:3000` (or a deployed preview). No automated assertions here — those live under `tests/`.
**Format**: 18 user-journey scenarios. Each has preconditions, numbered steps, expected results, PRD/task references, and a pass/fail checkbox.

How to use:
1. Start at the **Pre-flight** section and confirm the environment is sane.
2. Walk the journeys top-down — later journeys assume earlier ones passed (e.g., you need to be signed in for portfolio journeys).
3. For each step, the expected result is written so a "no" answer marks the journey **FAIL** and you log what you saw under "Notes".
4. Reset the simulation (Journey 14) between destructive runs so warning/risk state doesn't carry over.

---

## Pre-flight

- [ ] `.env.local` has values for `TWELVE_DATA_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] `npm run dev` starts on port 3000 with no compilation errors.
- [ ] Browser dev tools open — Console + Network tabs both visible.
- [ ] Two browser profiles available (regular + incognito) for cross-device and RLS journeys.
- [ ] Supabase dashboard open in a tab: https://supabase.com/dashboard/project/xfazrcthcildzqxuerhv

---

## Journey 1 — First-launch, signup, portfolio bootstrap

**Goal**: A brand-new visitor can create an account and land on a populated dashboard with $5,000 CAD.
**PRD refs**: §9.1, §18.0.1, §34.10. **Tasks**: T-024, T-057, T-058.

**Preconditions**: No prior session. Clear cookies for `localhost:3000` or use a fresh incognito window.

**Steps**:
1. Open `http://localhost:3000/`.
2. Read the landing card — it should disclose: starting cash $5,000 CAD, supported assets (Stocks & ETFs), exclusions (crypto/options/margin/shorting), and "educational only — not financial advice" disclaimer.
3. Try opening `/dashboard` directly in the URL bar.
4. Confirm you are redirected to `/auth/login?redirect=%2Fdashboard`.
5. Switch to the **Sign up** tab; enter a new email + password (≥6 chars).
6. Submit and watch the response: either inline "check your email" copy, or auto-login if email confirmation is disabled in Supabase.
7. If email confirmation is on: open the confirmation email, click the link, land on `/auth/callback`, end up on `/dashboard`.
8. On the dashboard, verify: portfolio value reads **$5,000.00 CAD**, cash reads **$5,000.00 CAD**, invested reads **$0.00**, return reads **0.00%** / **$0.00**.
9. Refresh the page once — same values stick.
10. In Supabase dashboard → Table editor → `profiles` and `portfolios`: confirm one row each with your `user_id`, default name "Personal Portfolio", `cash_cad = 5000.00`, `is_active = true`.

**Expected**: Disclaimer/scope visible on landing, deep-link to protected page redirects to login, signup creates account, dashboard bootstraps to $5k, DB rows present.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 2 — Login, logout, re-login

**Goal**: Existing user can sign in, sign out, and re-enter. Header state reflects auth.
**PRD refs**: §18.0.1. **Tasks**: T-057, T-058.

**Preconditions**: Account from Journey 1 exists. Currently signed in.

**Steps**:
1. Find the logout control in the header. Click it.
2. Confirm you are redirected to a public route (`/` or `/auth/login`).
3. Try `/portfolio` in URL bar → redirects to `/auth/login?redirect=%2Fportfolio`.
4. Sign in with the same credentials. After login, you should land on `/portfolio` (the deep-link target), not `/dashboard`.
5. Visit `/auth/login` again while signed in — should redirect to `/dashboard`.
6. Header now shows your email (or display name) and the logout control.

**Expected**: Logout clears session, deep-link preserved across redirect, signed-in users can't see login page.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 3 — Browse and search supported assets

**Goal**: Search returns supported equities/ETFs; unsupported ones are flagged.
**PRD refs**: §9.4, §26.1, §29.1, §30.2. **Tasks**: T-026, T-027, T-036.

**Preconditions**: Signed in. Settings → Market data mode = **API** (default).

**Steps**:
1. Open `/browse`.
2. Empty search → empty-state copy renders (per PRD §30.2).
3. Type `AAPL` and submit. Within ~2s the results table should populate.
4. Inspect the first row — confirm columns: Symbol, Name, Type (`STOCK`/`ETF`), Exchange, Currency, Price, Change %, Status, Action.
5. Change badge color: green for positive, red for negative, neutral for ~0.
6. Toggle the **ETFs** filter off — only `STOCK` rows visible. Toggle back.
7. Search a known unsupported asset (e.g., `BTC`) — either no results or rows marked unsupported with a reason.
8. Watch the Network tab — the request is to `/api/market/search`, **never** directly to `api.twelvedata.com`.

**Expected**: Search works against the internal API, supported/unsupported correctly flagged, filters reduce client-side, no direct Twelve Data calls from the browser.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 4 — Asset detail view

**Goal**: A specific symbol's page shows quote, chart, learning links, and trade entry.
**PRD refs**: §9.5, §16, §26.2, §26.3, §30.3. **Tasks**: T-028, T-041, T-044.

**Preconditions**: Signed in, came from Journey 3.

**Steps**:
1. From the browse results, click `AAPL` (or open `/asset/AAPL`).
2. Verify header shows: symbol, name, exchange, native currency, current price (USD), CAD-converted price, daily change %, last updated timestamp.
3. Quote freshness badge is one of: **Fresh** (≤2m), **Recent** (≤5m), **Stale** (>5m), **Unavailable**.
4. Historical chart renders (~30 daily points). If `<2` points returned, an insufficient-data empty state should show instead of a broken chart.
5. Learning links appear inline on labels like "Stock", "Price", "Currency Conversion" — click one and it navigates to `/learn/[slug]` in the same tab.
6. Hit the browser back button — returns to asset detail with state intact.
7. Buy and Sell buttons are visible. Sell is disabled or hidden if you don't own the asset yet.

**Expected**: All §9.5 "must-show" fields render, freshness badge present, chart loads or shows empty state, learning links route correctly.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 5 — Buy an asset (golden path)

**Goal**: Place a buy, see cash decrease and holding appear.
**PRD refs**: §10.1, §24.5, §31.1, §31.2. **Tasks**: T-015, T-017, T-029, T-030.

**Preconditions**: Signed in, on `/asset/AAPL` (or another supported asset). Cash ≥ $200 CAD.

**Steps**:
1. Click **Buy**. Trade ticket modal opens.
2. Enter quantity `1` (or any small fraction like `0.5`).
3. Preview area populates: price (USD + CAD), FX rate, estimated total CAD, cash after trade.
4. Note "Estimated cash after trade" is current cash minus total. Math should match what you see in the modal.
5. If any risk warnings apply (e.g., spending >50% on one asset), they render inline but do **not** block submit (PRD §12.3).
6. Click **Confirm**. Modal closes; brief success indicator may flash.
7. Navigate to `/portfolio`. Confirm:
   - Holdings table now has an `AAPL` row with the right quantity, current price, average cost, market value, unrealized G/L (~0 right after purchase, depending on price drift).
   - Cash summary card decreased by the same amount you spent.
8. Open `/dashboard` → Transactions history shows a new BUY row with the right symbol, qty, price CAD, total CAD, timestamp.
9. In Supabase dashboard → `transactions` table → one new BUY row. `holdings` table → one row with your quantity and `average_cost_cad`.

**Expected**: Trade applies, cash updates, holding appears, transaction logged, Supabase rows present, math consistent.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 6 — Buy more of an existing holding (average cost recalc)

**Goal**: Adding to a position blends the cost basis correctly per PRD §10.3.
**PRD refs**: §10.3, §24.5. **Tasks**: T-011, T-015, T-017.

**Preconditions**: Already own AAPL from Journey 5. Note the current `quantity` and `average_cost_cad`.

**Steps**:
1. Open `/asset/AAPL`. Note today's CAD price; call it `P_new`.
2. Click **Buy**, enter quantity `1` again. Confirm.
3. Open `/portfolio` and inspect the AAPL row.
4. Average cost should equal `((old_qty × old_avg) + (1 × P_new)) / (old_qty + 1)` — within rounding tolerance (display rounds to 2 decimals; stored to 4).
5. Quantity is `old_qty + 1`.
6. Total cash decreased by the new total.
7. Realized G/L on this transaction is **null** (BUY rows show `—`).

**Expected**: Average cost blends; no realized G/L on buys.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 7 — Sell partial position

**Goal**: Selling part of a holding decrements quantity, returns cash, books realized gain/loss.
**PRD refs**: §10.2, §24.5. **Tasks**: T-013, T-016, T-017, T-031.

**Preconditions**: Own ≥2 shares of AAPL (from Journeys 5 + 6).

**Steps**:
1. Open `/asset/AAPL` or click the row in `/portfolio` and pick **Sell**.
2. Sell modal shows: owned qty, average cost, current price, "Estimated proceeds", "Estimated realized G/L", "Remaining after sale".
3. Enter quantity `1`. Estimated realized G/L = `1 × (sellPriceCad − averageCostCad)`.
4. Try entering a quantity larger than owned → inline error, confirm button disabled.
5. Back to qty `1`. Confirm.
6. Open `/portfolio` and verify:
   - AAPL row still present, quantity decreased by 1, **average cost unchanged** (PRD §24.5).
   - Cash increased by approximately the proceeds CAD.
   - Realized G/L summary updated by the per-transaction realized G/L.
7. Transaction history shows a new SELL row with realized G/L populated (green if positive, red if negative).

**Expected**: Partial sell decrements quantity, average cost stable, realized G/L recorded.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 8 — Sell full position (holding auto-closes)

**Goal**: Selling all remaining shares removes the holding.
**PRD refs**: §10.2, §24.5 (`HOLDING_CLOSE_EPSILON = 1e-6`). **Tasks**: T-016, T-017.

**Preconditions**: Own ≥1 share of AAPL.

**Steps**:
1. Open Sell modal for AAPL.
2. Click "Sell all" / max button (or type the full owned quantity).
3. Estimated "Remaining after sale" reads `0` (or `<0.000001`, treated as 0).
4. Confirm.
5. `/portfolio` no longer lists AAPL in holdings.
6. Transactions history retains both BUY and SELL rows.
7. In Supabase → `holdings` table → row for AAPL is gone (or quantity 0, depending on impl; check matches code in `src/lib/trading/apply.ts`).

**Expected**: Holding disappears from UI on full sell, transactions preserved.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 9 — Portfolio dashboard, summary cards, holdings table

**Goal**: All portfolio analytics render correctly with multiple holdings.
**PRD refs**: §11, §16, §29.2, §29.3, §30.4. **Tasks**: T-032, T-033, T-034, T-042, T-043.

**Preconditions**: At least 2 different holdings open (e.g., buy AAPL + VFV.TO so you get USD + CAD mix and multiple sectors).

**Steps**:
1. Open `/portfolio`.
2. Summary cards visible: **Total Value**, **Cash**, **Invested**, **Return** (with $ and %). All right-aligned, tabular-numeral font.
3. Holdings table: 13 columns per PRD §29.2 (Symbol, Name, Type, Qty, Avg Cost, Current Price, Market Value, Unrealized G/L $, Unrealized G/L %, Currency, FX rate, Sector, Quote status).
4. For each row, verify:
   - Market value = qty × current price CAD.
   - Unrealized G/L $ = market value − (qty × avg cost CAD).
   - Quote status chip matches freshness (Fresh/Recent/Stale/Unavailable).
5. Sector allocation pie chart renders. Includes a **Cash** slice and any missing-sector items grouped under **Unknown**. Legend has labels + percentages (not color-only).
6. Portfolio value line chart renders. With <2 snapshots, an empty state shows instead.
7. Realized vs Unrealized explainer card visible, links to learning terms for "Cost Basis", "Realized Gain/Loss", "Portfolio", "Allocation".
8. Transactions table: all 9 columns, newest first. Sell rows show realized G/L value, Buy rows show `—`.

**Expected**: All analytics correct, charts render or show empty state, learning links present.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 10 — Quote freshness and refresh strategy

**Goal**: Freshness badges respect the time-since-quote thresholds; refresh fires at the right moments.
**PRD refs**: §16. **Tasks**: T-041.

**Preconditions**: Signed in, ≥1 holding. Have Settings open in a separate tab if you want to manipulate mock mode.

**Steps**:
1. Open `/portfolio`. Note the timestamp on a holding row's quote badge.
2. Leave the tab idle for >5 minutes. Without manual refresh, the badge should age into **Stale** unless an auto-refresh interval is wired (PRD allows 2–5 min interval as optional).
3. Hard-refresh the page (Ctrl+F5). Quotes re-fetch and badges return to **Fresh** / **Recent**.
4. Open the asset detail for a held symbol → quotes refresh on mount.
5. Open a Buy modal; let the quote age past 5 min without trading; verify the modal shows a "refresh" hint or re-fetches before confirm (PRD §31.2).
6. Force an FX failure: not easily done in UI — skip unless mock mode is wired (Journey 18).

**Expected**: Badges reflect actual age; mount + pre-confirm refreshes fire; stale-quote banner appears at the right times.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 11 — Diversification score and risk warnings

**Goal**: Score updates with portfolio shape; risk triggers raise warnings without blocking trades.
**PRD refs**: §12.1, §12.2, §12.3, §24.10. **Tasks**: T-048, T-049, T-050.

**Preconditions**: Signed in. Reset simulation first (Journey 14) so you start clean.

**Steps**:
1. Verify dashboard shows diversification score (some baseline value when only cash is held — likely low or neutral per PRD §12.1).
2. Buy one position large enough to exceed 50% of portfolio value (e.g., spend ~$3,000 of your $5,000 on a single stock).
3. Confirm a **concentration risk** warning is shown inline in the buy modal before confirming. Confirm anyway — the trade should still go through (warnings are non-blocking, PRD §12.3).
4. After the trade: dashboard shows the warning in the "Latest Warning" card. Acknowledge it; it moves out of active warnings.
5. Continue buying more of the same stock until you trigger another threshold (e.g., very high concentration, 90%+).
6. Diversification score should decrease as concentration increases.
7. Buy a 2nd holding in a different sector — score should improve (sector diversity bonus per PRD §12.1).
8. Visit the warnings history. Acknowledged warnings still appear but are marked inactive.
9. Each warning links to a related learning term (e.g., concentration → "Concentration Risk" learn page).

**Expected**: Score is dynamic and bounded 0–100, warnings raised at the right thresholds, never block trades, history persisted, learning deep-links work.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 12 — Learning Center

**Goal**: Browse, search, and read all 30 terms across 6 categories.
**PRD refs**: §9.7, §28, §30.6. **Tasks**: T-045, T-046, T-047.

**Preconditions**: Signed in (or signed out — `/learn` is public per `src/proxy.ts` PUBLIC_ROUTES).

**Steps**:
1. Open `/learn`.
2. All 6 category tabs render: Market, Portfolio, Gains/Losses (or similar), Risk, Long-Term/Simulator (exact label per PRD §9.7).
3. Without filtering: ≥30 term cards visible across categories.
4. Click a category tab — only terms in that category remain.
5. Search "average" — at least "Average Cost" appears, filtering on title + simple definition.
6. Click "Average Cost" card → `/learn/average-cost`.
7. Detail page shows: Title, Simple definition, "In the simulator", "Why it matters", Example, Related terms.
8. Related-term chips link to other slugs; click one and verify navigation.
9. Type a known-bad slug in the URL like `/learn/not-a-real-term` → 404 empty state from PRD §30.6.
10. After viewing several terms, in Supabase → `learning_progress` table → one row per `(user_id, term_slug)` you visited (if logged in and persistence is wired).

**Expected**: 30 terms reachable, categorization correct, search works, detail format complete, progress persisted.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 13 — Learning drawer from inside a trade modal

**Goal**: Clicking a learning link inside a trade modal opens a drawer without losing the trade state.
**PRD refs**: §31.3. **Tasks**: T-046, T-047.

**Preconditions**: Signed in, on `/asset/AAPL`.

**Steps**:
1. Click **Buy** to open the trade ticket.
2. Enter a quantity (e.g., `2`).
3. Click a learning link inside the modal (e.g., "Fractional Shares" or "Realized vs Unrealized").
4. A right-side drawer should open with the term's content. The trade modal is **still mounted** behind/beside it; quantity input is still `2`.
5. Close the drawer (esc or close button).
6. The trade ticket is intact — your quantity, preview values, etc. are unchanged.
7. Click confirm — trade proceeds normally.

**Expected**: Drawer opens beside trade modal; no navigation; trade input preserved.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 14 — Settings, display name, and reset

**Goal**: Settings page lets you update profile and reset the simulation; reset preserves the right fields.
**PRD refs**: §9.9, §24.7, §31.4, §31.5, §34.10. **Tasks**: T-020, T-025, T-061.

**Preconditions**: Signed in, at least 1 holding + 1 transaction + 1 acknowledged warning + 1 viewed learning term.

**Steps**:
1. Open `/settings`.
2. Display name input present. Change it to something new, save. Header reflects the new name immediately or after a refresh.
3. Market data mode toggle visible (API / MOCK). If holdings exist, switching to MOCK shows a confirmation prompt per PRD §31.5.
4. Disclaimer block visible.
5. Click **Reset Simulation**. ConfirmModal opens with copy listing what clears (cash → 5000, realized G/L → 0, holdings, transactions, snapshots, warnings) and what's kept (display name, market data mode, learning progress, auth account).
6. Confirm reset. Routed back to `/dashboard`.
7. Verify:
   - Cash = $5,000.00, Total Value = $5,000.00, Return = 0%.
   - Holdings table empty (empty state visible).
   - Transactions table empty.
   - Display name **unchanged** from step 2.
   - Market data mode **unchanged**.
   - Visited Learning terms still marked as viewed (Supabase `learning_progress` rows still there).
8. In Supabase: `holdings`, `transactions`, `portfolio_snapshots`, `risk_warnings` rows for your user_id all gone or count = 0. `portfolios.cash_cad = 5000.00`, `realized_gain_loss_cad = 0.00`. New snapshot row inserted.

**Expected**: Reset clears trading state, preserves user identity + learning, single transaction-like batch.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 15 — Compound growth tool

**Goal**: Standalone calculator returns correct results and renders dual chart.
**PRD refs**: §9.8, §13.2, §13.4. **Tasks**: T-051, T-052.

**Preconditions**: Signed in (or check whether `/compound-growth` is public — it's currently in the protected app shell).

**Steps**:
1. Open `/compound-growth`.
2. Default inputs visible: starting amount, monthly contribution, annual %, years. Verify the input controls accept numbers, support 0 monthly contribution, and reject negative years.
3. Known sanity check: starting `$0`, monthly `$200`, return `7%`, years `40` → future value approximately **$525,000** (within rounding). Summary cards: Contributed ≈ $96,000; Future Value ≈ $525,000; Growth (compounding) ≈ $429,000.
4. Dual-line chart shows both contributions-only and compounded curves; the gap is the "growth from compounding".
5. Edge cases:
   - Annual return `0%` → no divide-by-zero; future value equals total contributions.
   - Years `1` → chart still renders with at least the initial and final points.
6. Disclaimer per PRD §13.4 visible.
7. Learning links present for "Compound Growth", "Annual Return", "Time Horizon".

**Expected**: Formula matches PRD, chart renders, disclaimer visible, learning links resolve.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 16 — Refresh-page persistence and cross-device sync

**Goal**: State survives reload because Supabase is source of truth (PRD §18.5).
**PRD refs**: §18.5, §34.11. **Tasks**: T-019, T-059, T-060.

**Preconditions**: Signed in. Hold at least 1 position. Have a second browser profile / incognito window.

**Steps**:
1. Buy 1 share of an asset in the primary window. Observe the SyncStatus badge cycle from SYNCING → SYNCED.
2. Hard-refresh the page (Ctrl+F5). Portfolio remains intact — same cash, same holding, same transaction history.
3. Open dev tools → Application → Local Storage. Clear the `personal-stock-simulator-v1` key.
4. Refresh again. State **still** comes back (Supabase rehydrates).
5. In the second browser profile / incognito window, sign in with the **same** account.
6. Verify dashboard shows the same portfolio: same cash, same holding, same transactions.
7. Buy something in the second window. Reload the first window. The new trade appears (poll-based sync — may need refresh, not real-time).
8. (Optional) Turn off Wi-Fi briefly, attempt a trade. SyncStatus should reflect ERROR or OFFLINE; banner per PRD §34.11.

**Expected**: Supabase wins over localStorage; same account = same state across browsers; sync status badge accurate.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 17 — RLS / cross-user isolation (security check)

**Goal**: User A can never see or modify User B's data — RLS policies enforce isolation.
**PRD refs**: §34.9. **Tasks**: T-054.

**Preconditions**: Account A from earlier journeys. Create Account B fresh.

**Steps**:
1. Sign in as Account B (in an incognito window). Run Journeys 1–5 quickly so Account B has its own portfolio + 1 holding.
2. Note Account B's `user_id` from Supabase dashboard.
3. Sign back in as Account A in the primary window.
4. Open browser dev tools → Network. Trigger a portfolio sync (e.g., refresh `/portfolio`).
5. Find the Supabase REST/RPC call. Inspect the response — it should return **only** Account A's rows, never Account B's. Confirm no Account B `user_id` appears anywhere.
6. In the Supabase SQL editor, run as the authenticated role (impersonate via JWT):
   ```sql
   set role authenticated;
   set request.jwt.claim.sub = '<account A user_id>';
   select * from public.portfolios;
   select * from public.holdings;
   select * from public.transactions;
   ```
   All queries return only Account A's data.
7. As a stronger check, run the same queries as `anon`:
   ```sql
   set role anon;
   select * from public.portfolios;
   ```
   Should return **0 rows** for all 7 user-data tables.
8. Try writing to another user's row from a client (e.g., via the JS console: `supabase.from('portfolios').update({ name: 'hacked' }).eq('user_id', '<account B user_id>')`). Expect the update to silently affect 0 rows (RLS WITH CHECK denies).

**Expected**: Anon sees nothing, authenticated sees only their own data, cross-user writes silently fail.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Journey 18 — Mock-mode toggle

**Goal**: Switching to MOCK uses the deterministic fixture data instead of Twelve Data.
**PRD refs**: §31.5, §14.3. **Tasks**: T-040, T-025.

**Preconditions**: Signed in. Reset simulation so no holdings exist (Journey 14).

**Steps**:
1. Open `/settings`. Toggle market data mode to **MOCK**.
2. Open `/browse`. Search any of the 16 fixture symbols (e.g., `AAPL`, `MSFT`, `VFV.TO`, `XIC.TO`).
3. Results return instantly with no Network call to `/api/market/search` (or, if the route is still called, the response should be served from the mock layer — confirm from dev tools).
4. Prices match the mock fixture (deterministic per mulberry32 seed).
5. Buy 1 share. Trade applies the same way as API mode.
6. Switch mode back to API. Prices on the same symbol now come from Twelve Data; values may differ from your average cost — unrealized G/L should change accordingly.
7. Switching mode with holdings present prompts confirmation (PRD §31.5).

**Expected**: MOCK mode is fully offline-capable; toggle survives confirmation; values change as expected.

**Pass / Fail**: [ ]
**Notes**: ___

---

## Out of scope (per PRD §4.2 + §23)

The following are **explicitly excluded** from this MVP. Do **not** test for them — their absence is correct:

- Crypto, options, margin, short selling
- Teachers, classes, students, assignments, grading
- Leaderboards, badges, social features
- Real money, brokerage integration, wire transfers
- AI advice, signal recommendations, sentiment scoring
- Quizzes, certificates, video courses
- Dark mode
- Data export (CSV/PDF)
- Multi-portfolio per user (only one active portfolio per user, enforced by partial unique index)

---

## Pre-launch sign-off

Once all 18 journeys are PASS:

- [ ] All 18 journeys passed
- [ ] No P0 issues open
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] `npm test` (Vitest unit + integration) all green
- [ ] `npm run test:e2e` (Playwright smoke) all green
- [ ] Service-role key has not been exposed to client bundle (grep `dist/` for `SUPABASE_SERVICE_ROLE_KEY` — must return 0 hits)
- [ ] Twelve Data key not exposed to client bundle (grep `dist/` for `TWELVE_DATA_API_KEY` — must return 0 hits)
- [ ] Supabase RLS verified on every user-data table (Journey 17 passed)

**Reviewer**: ___
**Date**: ___
**Build / commit**: ___
