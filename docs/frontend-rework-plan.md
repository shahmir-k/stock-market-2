# Frontend Rework Plan

**Branch**: `frontend-rework`
**Direction**: Premium minimalist / editorial (Linear / Notion / Stripe feel)
**Scope**: Full reskin — every page + every component
**Guardrail**: Zero functional regressions. Re-run all 18 journeys in `docs/test-plan.md` via Playwright before merging.
**Estimated effort**: 2-3 days of focused work, split across 14 phases.

---

## North Star

> "Muted greys, generous spacing, no boxes-in-boxes." — your preview selection

The current UI is *functional* but generic — boxed cards, default Tailwind borders, no typographic hierarchy. The reworked UI should feel **calm, trustworthy, and editorial** — like reading a thoughtfully designed article that happens to let you trade stocks. The educational mission deserves a calm container; aggressive fintech color (Robinhood-style green flashes) would undercut the "patient long-term investor" message the PRD pushes throughout.

### Concrete design language

| Aspect | Current | New |
|---|---|---|
| Background | Flat white surface, boxed cards everywhere | Warm off-white (#FAFAF7-ish); content separated by hairline rules + whitespace, not boxes |
| Type — display | Sans-serif everywhere (Geist) | **Serif** for headings + KPI numbers (Instrument Serif or Fraunces) + sans for body & UI |
| Type — body | 14-16px Geist sans | Inter or Geist sans, 15-17px, slightly looser line-height |
| Type — numbers | Default | **Tabular nums** with `font-feature-settings: "tnum"` everywhere money is shown |
| Accent | Bright blue (#2563EB) | Deep forest green or warm graphite. Used sparingly. |
| Success / danger | Vivid green/red | Muted moss / muted rust |
| Borders | `border-border` solid 1px | Hairline (1px at 60% opacity); no heavy outlines |
| Radii | `rounded-2xl` (16px) on cards | 4-6px on inputs, 0 on hairline-separated sections |
| Shadows | `shadow-sm` / `shadow-xl` | Almost none. A single soft elevation for modals only. |
| Motion | None | Subtle: 200-400ms opacity + translate. No bounce, no spring. |
| Icons | Mixed | Phosphor Light or Lucide stroke-1 — thin, consistent |
| Density | Compact, multi-card per row | Wider rhythm, larger touch targets, more breathing |

---

## Phases (in order of execution)

Each phase ends with a Playwright spot-check on the affected pages. Final merge gate is the full 18-journey run from `docs/test-plan.md`.

---

### Phase 0 — Audit & design tokens
**Goal**: lock the design system before any component changes.
**Skill**: `design-taste-frontend` (process), `minimalist-ui` (direction)

- Inventory existing palette + fonts + spacing + radii. (`grep` `bg-`, `text-`, `border-`, `rounded-` in `src/`.)
- Pick the two fonts:
  - **Display serif**: Fraunces (variable, has dramatic weight range; Google Fonts) — used for h1, h2, KPI numbers
  - **Body sans**: Geist (already installed) — keep for body, labels, table cells
- Define the token set in `src/app/globals.css` under `@theme`:
  - `--font-display`, `--font-sans`
  - Color tokens: `--color-canvas`, `--color-surface`, `--color-rule`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-accent`, `--color-success`, `--color-danger`, `--color-warning`, `--color-info`
  - Spacing: keep Tailwind's default scale + add `--space-section` (96px desktop, 64px mobile) for between top-level sections
  - Radii: `--radius-input` (4px), `--radius-card` (6px), `--radius-modal` (12px)
- Add a global `font-feature-settings: "tnum" 1, "ss01" 1` on any element with class `tabular`.
- Add a `<RuleHairline />` primitive in `src/components/common/Rule.tsx` to replace the boxed-card divider pattern.

**Files**:
- `src/app/globals.css` (token block + global resets)
- `src/app/layout.tsx` (mount the new fonts via `next/font`)
- `src/components/common/Rule.tsx` (new)
- `docs/design-tokens.md` (reference doc)

**Verify**: visit any page; the new fonts and palette should already be visible (even though component layouts haven't changed yet).

---

### Phase 1 — Primitive components
**Goal**: rebuild every shared primitive against the new tokens. No page-level changes yet.
**Skill**: `design-taste-frontend`, `minimalist-ui`

| Primitive | File | Change |
|---|---|---|
| Button | new `src/components/common/Button.tsx` | Three variants: `primary` (subtle filled), `secondary` (ghost + hairline), `link` (text only). Generous horizontal padding, modest vertical. No rounded-2xl. |
| MetricCard | `src/components/common/MetricCard.tsx` | Strip the boxed container. Render: tiny uppercase label → giant serif number → tiny supporting line. |
| Card / Section | `src/components/common/Section.tsx` (new) | Replaces `rounded-xl border bg-surface p-6` pattern. Uses a hairline rule above + generous vertical padding. |
| Modal / Dialog | `src/components/common/Modal.tsx` (new) | Subtle elevation, more padding, serif heading. Replace ad-hoc `<dialog>` usage. |
| Drawer | `src/components/learn/LearningDrawer.tsx` | Keep the dialog mechanism; restyle: thin left border instead of full bezel, serif heading. |
| Input / Field | `src/components/common/Field.tsx` (new) | Inline label above field, hairline underline (no full box), 4px radius. |
| Badge | `src/components/common/Badge.tsx` (new) | Replaces `AssetTypeBadge`, `QuoteStatusBadge`, `RiskPill` with one component that takes a tone (`neutral` / `success` / `danger` / `warning` / `info`). Tone is colored *text*, not a chunky pill — except for the most critical state (HIGH-severity warning). |
| Tabs | new `src/components/common/Tabs.tsx` | Used by compound/backtest page and learning categories. Underline-active style, not button-active. |
| Table | new pattern in `src/components/common/Table.tsx` | Hairline rules, tabular numerals, generous row height, no zebra striping. |

**Verify**: build a quick `src/app/(app)/preview/page.tsx` (delete before merging) that renders one of each primitive. Eyeball it against the north star.

---

### Phase 2 — Layout shell
**Goal**: AppShell, Header, Sidebar — every page inherits this.
**File**: `src/components/layout/{AppShell,Header,SidebarNav,BottomNav}.tsx`

- Header: wordmark in display serif, portfolio value as inline text (not boxed), sync status as a text label with a coloured dot (replace the pill SyncStatusBadge with a smaller `<SyncStatusIndicator />`).
- Sidebar: nav items as plain text links, no boxes, active state is a thin left border + bolder weight.
- Reduce horizontal padding on the main content area to give the type more room.
- Bottom nav (mobile): same text-link treatment.

**Verify**: navigate `/dashboard`, `/browse`, `/portfolio`, `/learn`, `/compound-growth`, `/settings` — chrome should look consistent and noticeably more spacious.

---

### Phase 3 — Landing & auth
**Goal**: the first impression. Most important page for the boss demo.
**Files**: `src/app/page.tsx`, `src/components/setup/SetupForm.tsx`, `src/app/auth/login/page.tsx`, `src/components/auth/AuthForm.tsx`

- Hero with a serif headline (e.g., "Learn the market without losing real money."), one-paragraph subtitle, single CTA.
- Below the fold: a 2-column "What's included / What's not" comparison (Stocks & ETFs · No crypto/options/margin).
- Auth page: centered single column, serif heading, plain tabbed form. Drop the boxed card.

**Verify**: open in incognito; the page should feel like a marketing site, not an app login screen.

---

### Phase 4 — Dashboard
**Goal**: the page users land on after sign-in.
**File**: `src/app/(app)/dashboard/page.tsx`, `src/components/dashboard/*`

- **Hero KPI** at the top: giant serif portfolio value, one-line subtitle ("up $0.00 (0.00%) since you started"). Replace the four boxed summary cards with a one-line stat strip below: `Cash · Invested · Realized · Unrealized` separated by hairlines.
- **Portfolio Value chart** spans full width below; subtle, thin stroke, no fill area; only label start/end values.
- **Latest Warning** as a single editorial card with a hairline left border whose colour reflects severity. Headline is the warning title in serif; body is plain prose; acknowledge is a text button.
- **Recent Trades** as a clean list (date · type · symbol · qty · total) with hairline rules. Drop the table chrome.

**Verify**: visit `/dashboard` while holding 2-3 positions — should read like an investor letter, not a banking app.

---

### Phase 5 — Portfolio
**Goal**: the working surface.
**File**: `src/app/(app)/portfolio/page.tsx`, `src/components/portfolio/*`

- Same hero KPI pattern as Dashboard (Total Value as giant serif).
- **Holdings table** with hairline rules, no boxes. Right-align all numeric columns; tabular figures. Sector column is a small text badge (tone-only, not pill).
- **Sector allocation** rendered as a stacked horizontal bar (one row per sector) — more legible than a pie for small N. Keep the pie chart as a secondary toggle for visual variety.
- **Realized vs Unrealized explainer** becomes inline body text, not a card.
- **Transaction history** as a timeline (date heading + grouped trades that day) rather than a flat table.

**Verify**: visit `/portfolio` with 3+ holdings + 6+ transactions — it should feel like a research statement.

---

### Phase 6 — Browse & asset detail
**Goal**: discovery + decision pages.
**Files**: `src/app/(app)/browse/page.tsx`, `src/components/browse/*`, `src/app/(app)/asset/[symbol]/page.tsx`, `src/components/asset/AssetDetailClient.tsx`

- **Browse**: search input full-width hero (no surrounding card). Filters as text toggles. Results as hairline-separated rows.
- **Asset detail**:
  - Hero: huge serif price + small CAD subtitle + small freshness label. Symbol + name in body sans above.
  - Daily change as a clean inline metric, colour only on the up/down arrow.
  - Historical chart full width, no surrounding card.
  - Trade ticket below the fold (was side-by-side) — gives prices more room. On wide screens, sticky-right.
  - Learning links as a body-prose "Read about: Stock · Fractional Shares" line.

**Verify**: navigate to `/asset/AAPL` — the price should be the visual centre of the page.

---

### Phase 7 — Trade modal & learning drawer
**Goal**: action surfaces.
**Files**: `src/components/trading/TradeConfirmationModal.tsx`, `src/components/trading/TradeTicket.tsx`, `src/components/trading/RiskWarningInline.tsx`, `src/components/learn/LearningDrawer.tsx`

- **Modal**: rebuild on the new `Modal` primitive. Serif title. Table-of-values rendered as a `<dl>` with hairlines, not a styled box. Warning blocks as left-rule-coloured paragraphs (not chunky cards).
- **Trade ticket**: looser spacing, larger quantity input.
- **Learning drawer**: right-side sheet with a 1px left border. Article inside uses serif headings, comfortable line-height; close button is text "Close", upper right.

**Verify**: buy a position, click a learning link in the modal — the drawer should slide in cleanly; close it; trade quantity preserved.

---

### Phase 8 — Learn pages
**Goal**: the educational core.
**Files**: `src/app/(app)/learn/page.tsx`, `src/app/(app)/learn/[slug]/page.tsx`, `src/components/learn/*`

- Index: editorial directory layout — category sections with serif headings, term cards as text-only listings (title + 1-line definition + arrow).
- Term detail: long-form article styling — max-width 65ch, generous leading, large serif title, smaller meta line (Category · Read time). Related terms as text-link chips with hairline border.
- 404: keep the in-shell empty state but restyle to match.

**Verify**: read a term end-to-end at full width — should feel like a 600-word article on a news site.

---

### Phase 9 — Compound & Backtest
**Goal**: long-tail tools.
**Files**: `src/app/(app)/compound-growth/page.tsx`, `src/components/compound/*`, `src/components/charts/{CompoundGrowthChart,BacktestChart}.tsx`

- Tab nav uses the new `Tabs` primitive (underline-active).
- Inputs use the new `Field` primitive (no boxes around the form).
- Results: same hero metric pattern (giant serif final-value number), stat strip below, full-width chart.
- Disclaimer as small body text, not a coloured card.

**Verify**: run the AAPL $5,000 / 2021 / lump-sum backtest — the result should read as a quiet finding, not a flashy popup.

---

### Phase 10 — Settings
**Files**: `src/app/(app)/settings/page.tsx`, `src/components/settings/*`

- Settings as a single column of sections separated by hairlines. Each section: small heading + body controls.
- Reset Simulation lives in a final "Danger Zone" section with a subtle muted-rust accent (not a red chunky card).
- The reset confirmation modal uses the new `Modal` primitive.

**Verify**: change display name, toggle mode (with confirmation), reset (with confirmation) — all clean.

---

### Phase 11 — Chart theming
**Goal**: charts should match the rest of the app — calm, hairline grid, single accent.
**Files**: `src/components/charts/chartSetup.ts`, plus per-chart files

- Global Chart.js defaults (in `chartSetup.ts`):
  - `font.family` = body sans
  - `font.size` = 12
  - Grid lines hairline (1px at 8% opacity), no border
  - Tooltips: serif title, plain body, no shadow
- Per-chart palette: single accent line, no fill (or 4%-opacity fill). Cash slice in sector pie uses neutral grey.
- Tick formatting: `$` with comma separators; abbreviate >$10k as `$10k`.

**Verify**: the dashboard value chart and the backtest chart should look like cousins, not strangers.

---

### Phase 12 — Motion
**Goal**: subtle polish — never flashy.
**Mechanism**: Tailwind `transition` utilities + a tiny `Motion` wrapper for page transitions.

- **Page transitions**: 200ms fade + 4px translate-y on route change.
- **Modal / drawer enter**: 240ms scale-from-95% + fade.
- **Tooltip / hover**: 150ms opacity.
- **Number changes**: optional CountUp for portfolio value on first render — skip if it complicates testing.
- **No GSAP, no Framer Motion** for v1 — pure CSS transitions keep bundle small and testing simple. Add Framer later if specific interactions need it.

**Verify**: navigate between pages, open/close a modal — feels alive but never delays interaction.

---

### Phase 13 — Final QA
**Goal**: prove zero regressions before opening a PR.

1. **Typecheck + lint**: `npx tsc --noEmit && npx eslint src` (must be clean).
2. **Unit tests**: `npm test` (Vitest — must be green).
3. **Manual Playwright walk** of all 18 journeys from `docs/test-plan.md`. Mark each pass/fail; iterate on any regressions.
4. **Cross-device check**: resize Playwright viewport to 1440 / 1024 / 768 / 375 and screenshot Dashboard, Portfolio, Asset Detail, Trade modal. Layout should not break at any breakpoint.
5. **Lighthouse**: run accessibility + performance on Dashboard + Asset Detail. Fix any contrast or focus-order regressions. Target: A11y ≥ 95.
6. **Visual cross-reference**: side-by-side screenshot of before (commit `2ba6e52`) vs after (frontend-rework HEAD) for a one-shot demo deck.

---

## Dependencies

These get added in Phase 0 unless noted:

| Package | Purpose | Phase |
|---|---|---|
| `@fontsource-variable/fraunces` | Display serif (variable axes for tasteful weight ranges) | 0 |
| `phosphor-icons` or `lucide-react` (already?) | Thin-stroke icon set | 1 |
| (none) | No Framer Motion / GSAP — CSS only for v1 | 12 |

Total new runtime deps: ≤ 2. Keeps the bundle small.

---

## What stays the same

- All route paths (`/dashboard`, `/portfolio`, etc.) — no URL changes; nothing breaks deep-links or analytics
- All store actions and selectors (`src/store/simulatorStore.ts`)
- All business logic (`src/lib/calculations`, `src/lib/trading`, `src/lib/backtest`, `src/lib/risk`, `src/lib/diversification`, `src/lib/compound`, `src/lib/currency`, `src/lib/learning`)
- All API routes (`src/app/api/market/*`)
- Supabase schema, RLS, persistence (`supabase/`, `src/lib/persistence/`, `src/lib/supabase/`)
- All 30 learning terms (`src/content/learningTerms.ts`)
- Test suite (`tests/`)

**Only `src/components/`, `src/app/(app)/**/page.tsx`, `src/app/page.tsx`, `src/app/auth/**`, and `src/app/globals.css` are in scope.** Business logic is untouched. That's the contract that makes "zero functional regressions" a realistic guardrail.

---

## What changes externally (visible to users)

- Every page looks different
- Some component APIs change (e.g., `MetricCard` props, `Modal` replacing ad-hoc `<dialog>` usage) — internal refactor, no PRD impact
- PRD §32 "Design Tokens" is deliberately superseded — old tokens were a starting point, the new system is the production identity. We'll note this in the PR description so nobody thinks it's an oversight.

---

## What doesn't change (acceptance criteria)

- Every test in `docs/test-plan.md` (all 18 journeys) still passes
- All Vitest unit + integration tests pass
- All routes still load without console errors
- Lighthouse A11y score does not drop below 95 on any redesigned page
- Bundle size delta ≤ +30 KB gzipped (fonts dominate)

---

## Skill invocations by phase

| Phase | Primary skill | Secondary |
|---|---|---|
| 0 — tokens | `minimalist-ui` | `design-taste-frontend` |
| 1 — primitives | `design-taste-frontend` | `minimalist-ui` |
| 2 — shell | `design-taste-frontend` | — |
| 3 — landing | `high-end-visual-design` | `minimalist-ui` |
| 4-7 — app pages | `design-taste-frontend` | `redesign-existing-projects` (don't break functionality) |
| 8 — learn | `minimalist-ui` (editorial reading) | — |
| 9-10 — long tail | `design-taste-frontend` | — |
| 11 — charts | `high-end-visual-design` | — |
| 12 — motion | `design-taste-frontend` | — |
| 13 — QA | (Playwright walkthrough — no skill) | — |

When a phase starts, I'll invoke its primary skill via the Skill tool to pull in its specific rules before writing code.

---

## Open questions for you

A few decisions I'd flag before executing — answer inline if you have a preference; otherwise I'll pick a sensible default:

1. **Serif choice** — Fraunces (warmer, variable) vs Instrument Serif (more editorial, narrower). I'd default to **Fraunces** for warmth.
2. **Accent colour** — deep forest green (#2F4F3E-ish) vs warm graphite (#404040-ish). I'd default to **deep forest green** because the app's about growth.
3. **Sector breakdown** — keep pie chart, replace with horizontal bar, or offer both as a toggle. I'd default to **horizontal bar** primary with pie as toggle.
4. **Number animation** — animated count-up on first render of portfolio value, or static. I'd default to **static** — easier to test, never feels gimmicky.
5. **Mobile bottom nav** — keep the current 5-item bottom nav, or swap for a single FAB ("Trade") + scroll-down dock. I'd default to **keep current** — already works.

If none of these answers are deal-breakers, I'll proceed with the defaults and you can red-line during the demo.

---

## Recommended order of execution

If you want to interrupt me to demo something to your boss mid-flight, here's the order in which work becomes visible:

1. **End of Phase 0-1** (~3 hours): the app already looks calmer because tokens + primitives are restyled
2. **End of Phase 3** (~5 hours): landing page is the new "wow moment" — boss-demo ready in isolation
3. **End of Phase 5** (~10 hours): the core app (Dashboard, Portfolio, Browse, Asset Detail) is fully reskinned — the bulk of the demo experience
4. **End of Phase 11** (~16 hours): charts match — the visuals feel cohesive end-to-end
5. **End of Phase 13** (~20 hours): QA passed; PR-ready

Total: ~2.5 working days. I'll commit at the end of each phase so you can review (or revert) granularly.
