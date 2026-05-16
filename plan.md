# PRD.md — Personal Stock Market Simulator MVP

## 1. Product Summary

### 1.1 Product Name

**Personal Stock Market Simulator MVP**

Working names:

- InvestLab Personal
- Portfolio Practice
- Beginner Investor Lab
- Virtual Portfolio Simulator
- Personal Market Lab

The final product name is not locked. This document defines the confined MVP scope for a personal stock simulator without classroom features.

---

### 1.2 One-Sentence Product Definition

A beginner-friendly personal stock market simulator that lets one user practice buying and selling stocks and ETFs with virtual CAD while learning investing terms, tracking portfolio performance, understanding gains/losses, reviewing diversification, receiving risk warnings, and exploring compound growth.

---

### 1.3 Product Thesis

The previous classroom investing simulator plan was valuable, but too large for an initial MVP. It included teacher accounts, student accounts, class codes, classroom leaderboards, student visibility rules, teacher dashboards, exports, and multi-user backend systems.

The first MVP should prove the core investing simulation and learning experience for a single user before expanding into a classroom platform.

The personal MVP should answer:

- Can a beginner start with virtual money?
- Can they search for stocks and ETFs?
- Can they buy and sell virtual holdings?
- Can the app correctly update cash, holdings, cost basis, and gains/losses?
- Can the user understand how their portfolio is performing?
- Can the user learn important stock market and financial terms while using the simulator?
- Can the app teach basic investing concepts through pages, glossary entries, tooltips, warnings, and charts?

The MVP should focus on one learner practicing safely and understanding the result of each decision.

---

### 1.4 Revised Product Principle

The classroom version was:

> Students compete and learn in a class environment.

The personal MVP should be:

> One learner practices investing safely and understands the result of each decision.

---

### 1.5 MVP Boundary Statement

The MVP is successful if one user can:

1. Start with $5,000 CAD virtual cash.
2. Search for stocks and ETFs.
3. Buy and sell fractional shares.
4. See portfolio value update correctly.
5. Understand realized and unrealized gains/losses.
6. See persistent transaction history.
7. Refresh without losing progress.
8. View basic charts.
9. Receive basic diversification and risk feedback.
10. Use a compound growth tool.
11. Learn core stock market terms through a lightweight Learning Center.

Everything else belongs to future scope.

---

## 2. Why Scope Down?

### 2.1 Original Classroom Scope Was Too Large

The classroom version became a full platform. It included:

- Teacher accounts
- Student accounts
- Class creation
- Class codes
- Class leaderboards
- Teacher dashboards
- Student portfolio visibility rules
- Classmate portfolio views
- Teacher pause controls
- Teacher exports
- Reflection assignments
- Multi-user persistence
- Backend database
- Privacy controls for minors
- Future classroom administration features

That is too large for an initial MVP.

---

### 2.2 New MVP Strategy

The new MVP removes all multi-user/classroom platform requirements and focuses only on the core simulator engine plus a lightweight educational layer.

The goal is to prove:

- Trading simulation works.
- Portfolio math works.
- Persistence works.
- User can learn from their portfolio.
- User can learn financial terms from a dedicated Learning Center.
- UI is understandable.
- API integration can provide stock/ETF data.
- Mock data can support development and demos.

Once this personal simulator works, classroom features can be added later as a second product phase.

---

## 3. Target User

### 3.1 Primary User

The primary user is a beginner investor or student using the simulator personally.

Examples:

- High school student practicing investing independently
- College student learning basic markets
- Beginner adult investor
- Financial literacy learner
- Someone curious about investing but not ready to use real money

---

### 3.2 User Skill Level

The product assumes the user may not know:

- What a stock is
- What an ETF is
- What a portfolio is
- What a ticker symbol is
- What realized and unrealized gains are
- How portfolio value is calculated
- Why diversification matters
- Why prices move
- How compounding works

The UI must therefore explain key terms inline and provide a dedicated place to learn them.

---

### 3.3 Removed User Types

The MVP does not include:

- Teachers
- Classroom admins
- Real student cohorts
- Classmates
- Platform admins

These may return in future versions, but they are out of scope for this MVP.

---

## 4. Product Scope

### 4.1 In Scope

The personal MVP includes:

- Personal local simulator
- $5,000 CAD virtual starting cash
- Stocks and ETFs only
- Fractional shares
- Buy flow
- Sell flow
- Portfolio holdings table
- Cash balance
- Invested value
- Total portfolio value
- Total return
- Realized gains/losses
- Unrealized gains/losses
- Average cost per holding
- Transaction history
- Supabase Auth
- Supabase Postgres database
- Supabase Row Level Security policies
- Cloud persistence for user portfolios
- localStorage cache/draft recovery layer
- Reset simulation
- Twelve Data API quote/search integration
- Mock data fallback
- Basic Chart.js portfolio chart
- Basic diversification score
- Sector allocation pie chart
- Basic risk warnings
- Compound growth tool
- Lightweight Learning Center
- Glossary of stock market and financial terms
- Educational tooltips/copy throughout the app

---

### 4.2 Out of Scope

The personal MVP excludes:

- Teachers
- Classrooms
- Class codes
- Leaderboards
- Real class joining
- Multiplayer
- Classmate portfolios
- Teacher dashboards
- Teacher exports
- Teacher pause controls
- Reflection assignments
- Grading
- Badges, unless extremely simple and optional
- CSV/PDF exports
- Crypto
- Options
- Margin
- Short selling
- Leverage
- Real-money trading
- Brokerage integrations
- AI investment advice
- Personalized financial recommendations
- Complex course progress tracking
- Quizzes
- Certificates
- Videos
- Long-form curriculum management

---

## 5. Core User Stories

### 5.1 Main User Story

As a beginner investor, I want to practice buying and selling stocks with virtual money so that I can understand how investing works before risking real money.

---

### 5.2 Learning User Story

As a beginner investor, I want to learn stock market and financial terms in simple language so that I understand what the simulator is showing me.

---

### 5.3 Portfolio User Story

As a user, I want to see my cash, holdings, total value, and gains/losses so that I know how my decisions affected my virtual portfolio.

---

### 5.4 Risk User Story

As a user, I want warnings when my portfolio is highly concentrated or risky so that I understand the tradeoff I am making.

---

### 5.5 Compound Growth User Story

As a user, I want to test contribution and return scenarios so that I can see how compounding affects long-term growth.

---

## 6. Core User Flow

```txt
Open app
→ Start with $5,000 CAD
→ Optionally enter display name
→ Land on dashboard
→ Search for a stock or ETF
→ View current quote
→ Buy fractional shares
→ Cash decreases
→ Portfolio updates
→ View unrealized gain/loss
→ Learn what unrealized gain/loss means
→ Sell part or all of a holding
→ View realized gain/loss
→ See diversification/risk feedback
→ Open Learning Center to understand terms
→ Use compound growth tool
→ Refresh page and progress remains saved through Supabase cloud persistence
→ If offline or temporarily disconnected, localStorage cache helps preserve recent state
```

---

## 7. Core Product Decisions

### 7.1 Product Type

```txt
Personal investing simulator
```

This is not a classroom platform in MVP.

---

### 7.2 Starting Balance

Each local simulation starts with:

```txt
$5,000 CAD
```

---

### 7.3 Starting Portfolio

The user starts with:

- $5,000 CAD virtual cash
- No holdings
- No transactions
- No realized gains/losses
- No risk warnings
- Initial portfolio value of $5,000 CAD

---

### 7.4 Assets Allowed

Allowed:

- Stocks
- ETFs

Excluded:

- Crypto
- Options
- Margin
- Short selling
- Leverage

---

### 7.5 Shares

Fractional shares are allowed.

Reason:

- The user only starts with $5,000 CAD.
- Some stocks and ETFs are expensive.
- Fractional shares make diversification easier.

Recommended precision:

```txt
Up to 6 decimal places internally
Display quantities with sensible rounding
```

---

### 7.6 Trading Fees

MVP has no trading fees.

Reason:

- Simpler for beginner users.
- Easier to build.
- Keeps focus on portfolio basics.

Trading fees can become a future advanced realism setting.

---

### 7.7 Market Hours

Do not build a complex market-hours system in MVP.

MVP rule:

```txt
Trades execute using the latest available quote.
```

If quote data may be delayed or stale, show a clear warning.

Example:

```txt
This trade uses the latest available price. Market data may be delayed.
```

---

### 7.8 Currency

Base portfolio currency:

```txt
CAD
```

If trading USD assets:

- Show asset price in native currency.
- Convert estimated cost/proceeds to CAD.
- Show FX rate if available.

MVP simplification options:

1. Use Twelve Data FX where available.
2. Use a fixed USD/CAD rate during development.
3. Use mock conversion in mock mode.

The UI must clearly show when values are estimated.

---

## 8. Information Architecture and Navigation

### 8.1 Required MVP Pages

The personal MVP should include six primary pages:

```txt
Dashboard
Browse
Portfolio
Learn
Compound Growth
Settings
```

Optional but recommended:

```txt
Asset Detail
```

Asset detail may be implemented as a route, modal, or drawer depending on development time.

---

### 8.2 Navigation

Recommended desktop navigation:

```txt
Dashboard | Browse | Portfolio | Learn | Compound Growth | Settings
```

Recommended mobile navigation:

```txt
Dashboard | Browse | Portfolio | Learn | More
```

`More` can contain Compound Growth and Settings.

---

### 8.3 Route Map

Recommended routes:

| Route | Page | Purpose |
|---|---|---|
| `/` | Setup or redirect | First launch / initialize simulator |
| `/dashboard` | Dashboard | Overview of portfolio and health |
| `/browse` | Browse | Search stocks and ETFs |
| `/asset/[symbol]` | Asset Detail | Quote, details, buy/sell controls |
| `/portfolio` | Portfolio | Holdings, analytics, transactions |
| `/learn` | Learning Center | Glossary and beginner lessons |
| `/learn/[slug]` | Term Detail | Dedicated explanation for one concept |
| `/compound-growth` | Compound Growth | Compound interest calculator/chart |
| `/settings` | Settings | Reset, data mode, disclaimer |

If using modals instead of asset routes, `/asset/[symbol]` may be postponed.

---

## 9. Screen Requirements and Wireframes

## 9.1 First Launch / Setup

### Purpose

Initialize the personal simulator.

### Requirements

The setup screen should:

- Explain the simulator is for virtual practice only.
- Show the starting balance of $5,000 CAD.
- Explain that only stocks and ETFs are supported.
- Explain that crypto, options, margin, and short selling are excluded.
- Optionally collect a display name.
- Start the simulation.

### Wireframe

```txt
┌──────────────────────────────────────────────┐
│ Personal Stock Market Simulator              │
│ Practice investing safely with virtual CAD.  │
│                                              │
│ Starting cash: $5,000 CAD                    │
│ Assets: Stocks and ETFs                      │
│ Excluded: crypto, options, margin, shorts    │
│                                              │
│ This simulator uses virtual money only and   │
│ does not provide financial advice.           │
│                                              │
│ Optional display name                        │
│ [________________________]                   │
│                                              │
│ [ Start Simulation ]                         │
└──────────────────────────────────────────────┘
```

---

## 9.2 Global App Shell

### Desktop Wireframe

```txt
┌───────────────────────────────────────────────────────────────┐
│ Header                                                        │
│ Personal Stock Simulator             Portfolio: $5,342   ⚙    │
├───────────────┬───────────────────────────────────────────────┤
│ Sidebar Nav   │ Page Content                                  │
│               │                                               │
│ Dashboard     │                                               │
│ Browse        │                                               │
│ Portfolio     │                                               │
│ Learn         │                                               │
│ Compound      │                                               │
│ Settings      │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

### Mobile Wireframe

```txt
┌─────────────────────────────┐
│ Header                      │
├─────────────────────────────┤
│ Page Content                │
│                             │
├─────────────────────────────┤
│ Bottom Nav                  │
│ Dashboard Browse Portfolio  │
│ Learn More                  │
└─────────────────────────────┘
```

---

## 9.3 Dashboard

### Purpose

Show the current state of the user’s portfolio quickly.

### Must Show

- Portfolio value
- Total return
- Cash balance
- Invested amount
- Risk level
- Diversification score
- Portfolio value chart
- Latest warning or learning tip
- Recent trades
- Main CTA to browse assets

### Wireframe

```txt
┌──────────────────────────────────────────────────────────────┐
│ Dashboard                                      Last updated  │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ Portfolio  │ │ Return     │ │ Cash       │ │ Invested   │ │
│ │ $5,342.18  │ │ +6.84%     │ │ $812.40    │ │ $4,529.78  │ │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────┐ ┌─────────────────┐ │
│ │ Portfolio Value Over Time           │ │ Portfolio Health│ │
│ │ [Line Chart]                        │ │ Div: 64/100     │ │
│ │                                     │ │ Risk: Medium    │ │
│ │                                     │ │ [View why]      │ │
│ └─────────────────────────────────────┘ └─────────────────┘ │
│                                                              │
│ ┌──────────────────────────────┐ ┌────────────────────────┐ │
│ │ Latest Warning / Tip         │ │ Next Action            │ │
│ │ Too much in one sector...    │ │ Browse stocks/ETFs     │ │
│ │ [Learn more]                 │ │ [Browse]               │ │
│ └──────────────────────────────┘ └────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Recent Trades                                             │ │
│ │ BUY AAPL 1.25 shares — $342.10 CAD                        │ │
│ │ SELL TD.TO 2 shares — realized +$12.40                    │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 9.4 Browse

### Purpose

Let the user search for stocks and ETFs to inspect and trade.

### Must Show

- Search input
- Asset type filter
- Search results
- Symbol
- Name
- Asset type
- Exchange, if available
- Currency
- Current/latest price
- Daily change, if available
- Buy action

### Wireframe

```txt
┌──────────────────────────────────────────────────────────────┐
│ Browse Stocks & ETFs                                         │
├──────────────────────────────────────────────────────────────┤
│ [ Search symbol or company name...                 ] [Search]│
│                                                              │
│ Filters: [Stocks v] [ETFs v]                                 │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Symbol │ Name              │ Type │ Price │ Change │ CTA │ │
│ │ AAPL   │ Apple Inc.        │ Stock│ $...  │ +1.2%  │ Buy │ │
│ │ VFV.TO │ Vanguard S&P 500  │ ETF  │ $...  │ -0.4%  │ Buy │ │
│ │ TD.TO  │ TD Bank           │ Stock│ $...  │ +0.3%  │ Buy │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Empty state: Search for a stock or ETF to start investing.   │
└──────────────────────────────────────────────────────────────┘
```

---

## 9.5 Asset Detail / Trade Modal

### Purpose

Show the selected asset quote and allow buy/sell actions.

This can be a route, drawer, or modal.

### Must Show

- Symbol
- Name
- Asset type
- Exchange
- Currency
- Current price
- CAD conversion estimate
- Daily change
- Last updated timestamp
- Quantity input
- Estimated trade cost/proceeds
- Cash after trade
- Risk warning if triggered
- Confirm button
- Links to relevant Learning Center terms, such as stock, ETF, price, and fractional shares

### Buy Modal Wireframe

```txt
┌──────────────────────────────────────────────┐
│ Buy AAPL — Apple Inc.                        │
├──────────────────────────────────────────────┤
│ Price: $212.44 USD                           │
│ Estimated CAD: $291.04 CAD                   │
│ Last updated: 2:34 PM                        │
│                                              │
│ Quantity                                     │
│ [ 1.25 ] shares                              │
│                                              │
│ Estimated cost: $363.80 CAD                  │
│ Cash after trade: $4,636.20 CAD              │
│                                              │
│ Warning                                      │
│ This trade may increase concentration risk.  │
│                                              │
│ Learn: What is a stock? | What is price?     │
│                                              │
│ [Cancel]                         [Confirm]   │
└──────────────────────────────────────────────┘
```

### Sell Modal Wireframe

```txt
┌──────────────────────────────────────────────┐
│ Sell AAPL — Apple Inc.                       │
├──────────────────────────────────────────────┤
│ Owned: 2.50 shares                           │
│ Average cost: $280.10 CAD                    │
│ Current price: $291.04 CAD                   │
│                                              │
│ Quantity to sell                             │
│ [ 1.00 ] shares                              │
│                                              │
│ Estimated proceeds: $291.04 CAD              │
│ Estimated realized gain: +$10.94 CAD         │
│ Remaining shares: 1.50                       │
│                                              │
│ Learn: Realized vs. unrealized gains         │
│                                              │
│ [Cancel]                            [Sell]   │
└──────────────────────────────────────────────┘
```

---

## 9.6 Portfolio

### Purpose

Show holdings, performance, gains/losses, diversification, and transaction history.

### Must Show

- Cash
- Invested value
- Total portfolio value
- Total return
- Realized gains/losses
- Unrealized gains/losses
- Holdings table
- Transaction history
- Diversification score
- Sector allocation pie chart
- Links to relevant learning terms

### Wireframe

```txt
┌──────────────────────────────────────────────────────────────┐
│ Portfolio                                                    │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ Total      │ │ Cash       │ │ Invested   │ │ Return     │ │
│ │ $5,342.18  │ │ $812.40    │ │ $4,529.78  │ │ +$342.18   │ │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                              │
│ ┌─────────────────────────────┐ ┌──────────────────────────┐ │
│ │ Sector Allocation            │ │ Portfolio Health        │ │
│ │ [Pie Chart]                  │ │ Diversification: 64/100 │ │
│ │ Technology 52%               │ │ Risk: Medium            │ │
│ │ Financials 18%               │ │ Main issue: concentration│ │
│ └─────────────────────────────┘ └──────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Holdings                                                  │ │
│ │ Symbol │ Qty │ Avg Cost │ Price │ Value │ G/L │ Alloc.   │ │
│ │ AAPL   │1.25 │ $280.10  │$291.04│$363.80│+... │ 6.8%     │ │
│ │ TD.TO  │8.00 │ $79.00   │$77.50 │$620.00│-... │ 11.6%    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Transaction History                                       │ │
│ │ BUY AAPL — 1.25 shares — $363.80 CAD                      │ │
│ │ SELL TD.TO — 2 shares — realized +$12.40 CAD              │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Learn: Portfolio | Cost Basis | Realized Gain | Allocation   │
└──────────────────────────────────────────────────────────────┘
```

---

## 9.7 Learning Center

### Purpose

The Learning Center teaches users the stock market and financial terms used throughout the simulator.

The simulator should not assume the user already understands the terms shown in the dashboard, portfolio, trade modals, or charts.

### MVP Scope

The MVP Learning Center should include:

- A glossary page
- 10–20 beginner terms
- Search/filter for terms, if simple
- Term cards
- Dedicated term detail pages or expandable detail cards
- Links from tooltips and UI labels to relevant terms

The MVP should not include:

- Quizzes
- Course progress tracking
- Certificates
- Video lessons
- Teacher assignments
- Long curriculum modules

---

### Learning Center Categories

Required categories:

1. Market Basics
2. Portfolio Basics
3. Gains and Losses
4. Risk and Diversification
5. Long-Term Investing
6. Simulator Concepts

---

### Required Learning Terms

#### Market Basics

- Stock
- ETF
- Share
- Ticker Symbol
- Stock Exchange
- Market Price
- Price Change
- Volume, optional if API data is available

#### Portfolio Basics

- Portfolio
- Cash Balance
- Invested Value
- Portfolio Value
- Allocation
- Average Cost
- Cost Basis

#### Gains and Losses

- Gain/Loss
- Total Return
- Realized Gain/Loss
- Unrealized Gain/Loss
- Return Percentage

#### Risk and Diversification

- Diversification
- Concentration Risk
- Sector Risk
- Volatility
- Risk vs. Reward
- Going All-In

#### Long-Term Investing

- Compound Growth
- Contribution
- Annual Return
- Time Horizon
- Starting Early

#### Simulator Concepts

- Virtual Trading
- Fractional Shares
- Delayed Prices
- CAD/USD Conversion
- Not Financial Advice

---

### Learning Center Wireframe

```txt
┌──────────────────────────────────────────────────────────────┐
│ Learn Investing Terms                                        │
├──────────────────────────────────────────────────────────────┤
│ [ Search terms...                                    ]        │
│                                                              │
│ Categories:                                                  │
│ [Market Basics] [Portfolio] [Gains/Losses] [Risk] [Long-Term]│
│                                                              │
│ ┌────────────────────┐ ┌────────────────────┐               │
│ │ What is a stock?   │ │ What is an ETF?     │               │
│ │ A small piece of   │ │ A fund that holds   │               │
│ │ ownership in a...  │ │ many investments... │               │
│ │ [Read more]        │ │ [Read more]         │               │
│ └────────────────────┘ └────────────────────┘               │
│                                                              │
│ ┌────────────────────┐ ┌────────────────────┐               │
│ │ Unrealized Gain    │ │ Diversification     │               │
│ │ Gain/loss on what  │ │ Spreading risk...   │               │
│ │ you still own...   │ │ [Read more]         │               │
│ └────────────────────┘ └────────────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

---

### Term Detail Page Format

Each term should use a consistent structure:

```txt
Title
Simple definition
In the simulator
Why it matters
Example
Related terms
```

Example:

```txt
Title: What is a stock?

Simple definition:
A stock is a small piece of ownership in a company.

In the simulator:
When you buy Apple stock, your portfolio owns virtual shares of Apple.

Why it matters:
If the stock price goes up, your holding becomes worth more. If it goes down, your holding becomes worth less.

Example:
You buy 2 shares at $100 each.
Later the price is $110.
Your shares are now worth $220.
Your unrealized gain is $20.

Related terms:
Share, Price, Portfolio, Gain/Loss
```

---

### Term Detail Wireframe

```txt
┌──────────────────────────────────────────────────────────────┐
│ What is a stock?                                             │
├──────────────────────────────────────────────────────────────┤
│ Simple Definition                                             │
│ A stock is a small piece of ownership in a company.           │
│                                                              │
│ In the Simulator                                              │
│ When you buy Apple stock, your portfolio owns virtual shares. │
│                                                              │
│ Why It Matters                                                │
│ If the price goes up, your holding becomes worth more.        │
│ If the price goes down, your holding becomes worth less.      │
│                                                              │
│ Example                                                       │
│ Buy 2 shares at $100 = $200 cost.                             │
│ Price rises to $110 = $220 value.                             │
│ Unrealized gain = $20.                                        │
│                                                              │
│ Related Terms                                                 │
│ [Share] [Price] [Portfolio] [Unrealized Gain]                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 9.8 Compound Growth

### Purpose

Teach the user how compounding works over time.

### Inputs

- Starting amount
- Monthly contribution
- Annual return percentage
- Years invested

### Outputs

- Total contributed
- Estimated future value
- Growth from compounding
- Dual-line chart

### Wireframe

```txt
┌──────────────────────────────────────────────────────────────┐
│ Compound Growth Tool                                         │
├──────────────────────────────────────────────────────────────┤
│ Starting Amount:       [$0       ] CAD                       │
│ Monthly Contribution:  [$200     ] CAD                       │
│ Annual Return:         [7        ] %                         │
│ Years Invested:        [40       ] years                     │
│                                                              │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                 │
│ │ Contributed│ │ Future Val.│ │ Growth     │                 │
│ │ $96,000    │ │ $525,000   │ │ $429,000   │                 │
│ └────────────┘ └────────────┘ └────────────┘                 │
│                                                              │
│ [Dual Line Chart: Contributions vs Compounded Value]         │
│                                                              │
│ Learn: Compound Growth | Annual Return | Time Horizon        │
│                                                              │
│ Disclaimer: This is an educational estimate. Returns are not │
│ guaranteed.                                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 9.9 Settings

### Purpose

Allow user to manage the local simulation.

### Must Show

- Display name, if implemented
- Data mode: API/mock, if useful during development
- Starting balance display
- Reset simulation
- Education-only disclaimer

### Wireframe

```txt
┌──────────────────────────────────────────────┐
│ Settings                                     │
├──────────────────────────────────────────────┤
│ Display Name                                 │
│ [ BeginnerInvestor          ] [Save]         │
│                                              │
│ Data Mode                                    │
│ [ API Data ] [ Mock Data ]                   │
│                                              │
│ Simulation                                   │
│ Starting Balance: $5,000 CAD                 │
│ Fractional Shares: Enabled                   │
│ Crypto: Disabled                             │
│ Options/Margin/Shorting: Disabled            │
│                                              │
│ Disclaimer                                   │
│ This simulator uses virtual money only.      │
│                                              │
│ Danger Zone                                  │
│ [ Reset Simulation ]                         │
└──────────────────────────────────────────────┘
```

---

## 10. Trading Requirements

### 10.1 Buy Logic

The user can buy stocks/ETFs using virtual CAD.

Buy order fields:

- Symbol
- Quantity
- Quote price
- Native currency
- FX rate to CAD
- Estimated CAD cost

Validation:

- Quantity must be greater than 0.
- Quantity must be a valid number.
- Asset must exist.
- Quote must be available.
- CAD cost must be greater than 0.
- User must have enough cash.

After successful buy:

- Cash decreases.
- Holding is created or updated.
- Average cost is recalculated.
- Transaction is recorded.
- Portfolio snapshot is recorded.
- Diversification score is recalculated.
- Risk warnings are evaluated.
- State is saved to localStorage.

---

### 10.2 Sell Logic

The user can sell part or all of an owned holding.

Sell order fields:

- Symbol
- Quantity
- Quote price
- Native currency
- FX rate to CAD
- Estimated CAD proceeds

Validation:

- User must own the asset.
- Quantity must be greater than 0.
- Quantity must be less than or equal to owned quantity.
- Quote must be available.

After successful sell:

- Cash increases.
- Holding quantity decreases.
- Holding is removed if quantity reaches zero.
- Realized gain/loss is calculated.
- Transaction is recorded.
- Portfolio snapshot is recorded.
- Diversification score is recalculated.
- Risk warnings are evaluated.
- State is saved to localStorage.

---

### 10.3 Average Cost

MVP uses average cost basis.

When buying more of an existing holding:

```txt
New Average Cost = (Old Cost Basis + New Purchase Cost) / New Quantity
```

Average cost is easier for beginners than FIFO.

---

### 10.4 Realized vs. Unrealized Gains

The app must distinguish:

**Unrealized gain/loss**

> Gain or loss on investments the user still owns.

**Realized gain/loss**

> Gain or loss locked in when the user sells.

This explanation should appear directly in the portfolio UI and link to the relevant Learning Center term.

---

## 11. Portfolio Analytics

### 11.1 Required Metrics

The portfolio must calculate:

- Cash balance
- Invested value
- Total portfolio value
- Total return CAD
- Total return percentage
- Realized gains/losses
- Unrealized gains/losses
- Market value per holding
- Cost basis per holding
- Average cost per holding
- Allocation percentage per holding
- Sector allocation
- Diversification score
- Risk level

---

### 11.2 Core Formulas

```txt
Holding Market Value = Quantity × Current Price in CAD
```

```txt
Holding Cost Basis = Quantity × Average Cost in CAD
```

```txt
Unrealized Gain/Loss = Holding Market Value - Holding Cost Basis
```

```txt
Total Portfolio Value = Cash + Sum of Holding Market Values
```

```txt
Total Return CAD = Total Portfolio Value - Starting Balance
```

```txt
Total Return % = Total Return CAD / Starting Balance × 100
```

---

### 11.3 Portfolio Snapshots

The app should record portfolio snapshots:

- At simulation start
- After every buy
- After every sell
- After quote refresh if portfolio value changes

Snapshots support the portfolio value chart.

---

## 12. Diversification and Risk

### 12.1 Diversification Score

The MVP should include a simple 0–100 diversification score.

Purpose:

- Teach concentration risk.
- Help user understand whether portfolio is spread out.
- Provide useful feedback without blocking trades.

Recommended scoring:

Start at 100.

Subtract:

| Condition | Penalty |
|---|---:|
| One holding > 60% of invested value | -30 |
| One sector > 70% of invested value | -20 |
| Fewer than 3 holdings | -15 |
| Fewer than 2 sectors | -10 |
| Cash below 1% of total portfolio | -10 |
| Portfolio 100% cash after user has started | -10 |

Add:

| Condition | Bonus |
|---|---:|
| 5 or more holdings | +5 |
| 3 or more sectors | +5 |
| Broad-market ETF included | +5 |

Clamp final score between 0 and 100.

---

### 12.2 Diversification Labels

| Score | Label |
|---:|---|
| 85–100 | Strong diversification |
| 70–84 | Good diversification |
| 50–69 | Moderate concentration |
| 30–49 | High concentration risk |
| 0–29 | Very high concentration risk |

---

### 12.3 Risk Warnings

MVP warnings should include:

| Trigger | Warning |
|---|---|
| One stock > 50% of portfolio | Single-stock concentration |
| One sector > 70% of portfolio | Sector concentration |
| Only one holding | Lack of diversification |
| Cash < 1% after trade | All-in / no cash reserve |
| More than 5 trades in one day | Overtrading |
| Sell after large drop | Panic selling risk |
| Buy after sharp rise | Chasing performance |

Warnings should educate, not block.

Example:

```txt
This trade would put 72% of your portfolio into one company. That creates concentration risk because one bad event could affect most of your portfolio.
```

Warnings should link to the Learning Center where relevant.

---

## 13. Compound Growth Tool

### 13.1 Purpose

The compound growth tool helps users understand long-term investing and the value of starting early.

---

### 13.2 Formula

For monthly contributions:

```txt
Future Value = StartingAmount × (1 + r/12)^(12t) + MonthlyContribution × [((1 + r/12)^(12t) - 1) / (r/12)]
```

Where:

- `r` = annual return as decimal
- `t` = years invested

---

### 13.3 Required Chart

Use Chart.js to show two lines:

- Contributions only
- Contributions + compound growth

---

### 13.4 Required Disclaimer

The tool must display:

```txt
This is an educational estimate. Investment returns are not guaranteed.
```

---

## 14. Technical Architecture

### 14.1 Locked Framework and Deployment Stack

The MVP will be deployed as a serverless app on **Vercel**.

Because of that deployment target, the framework choice is locked:

```txt
Framework: Next.js App Router
Deployment: Vercel
Language: TypeScript
Styling: Tailwind CSS
State Management: Zustand
Charts: Chart.js via react-chartjs-2
Primary Persistence: Supabase Postgres
Auth: Supabase Auth
Database Security: Supabase Row Level Security
Client Cache / Draft Recovery: localStorage
Serverless API Layer: Next.js Route Handlers deployed as Vercel Functions
Market Data Provider: Twelve Data API through internal serverless proxy routes
```

This replaces any earlier ambiguity around using plain React, Vite, or Next.js. The MVP must use **Next.js App Router** because the app needs both a frontend and a lightweight serverless API proxy for Twelve Data.

Plain React/Vite is not recommended for this project because it would require either exposing the Twelve Data API key to the browser or building a separate backend/proxy layer. Next.js on Vercel gives the project frontend pages and serverless API routes in the same repo.

---

### 14.2 Vercel Serverless Architecture

The frontend must never call Twelve Data directly.

Required request flow:

```txt
Browser UI
  ↓
Next.js Client Components / Pages
  ↓
Internal Next.js API Route Handlers on Vercel
  /api/market/search
  /api/market/quote
  /api/market/history
  /api/market/fx
  ↓
Twelve Data API
```

The Twelve Data API key must be stored as a Vercel environment variable and accessed only from server-side route handlers.

Required environment variable:

```txt
TWELVE_DATA_API_KEY=...
```

Forbidden client-exposed environment variable:

```txt
NEXT_PUBLIC_TWELVE_DATA_API_KEY
```

Do not prefix the Twelve Data API key with `NEXT_PUBLIC_`, because that would expose it to browser-side code.

---

### 14.3 Required Internal API Routes

The MVP must include these serverless API routes:

```txt
GET /api/market/search?q=
GET /api/market/quote?symbol=&exchange=
GET /api/market/history?symbol=&interval=1day&outputsize=30
GET /api/market/fx?from=USD&to=CAD
```

These routes are responsible for:

- Reading the Twelve Data API key from server-side environment variables
- Calling Twelve Data
- Normalizing Twelve Data responses
- Handling Twelve Data errors
- Returning clean app-specific JSON to the frontend
- Preventing API key exposure

Frontend components and stores must call only these internal routes. They must not call Twelve Data directly.

---

### 14.4 Twelve Data Endpoint Mapping

The required Twelve Data REST endpoints are:

| App Route | Twelve Data Endpoint | Purpose |
|---|---|---|
| `/api/market/search` | `symbol_search` | Search for stocks/ETFs by symbol or name |
| `/api/market/quote` | `quote` | Fetch latest quote for a symbol |
| `/api/market/history` | `time_series` | Fetch historical price data for asset charts |
| `/api/market/fx` | `exchange_rate` | Fetch FX rate such as USD/CAD |

The MVP should not use WebSockets. REST polling is sufficient because prices only need to update every few minutes.

---

### 14.5 Required API Caching Rules

To reduce API usage and avoid rate-limit issues, internal API routes should implement basic caching where feasible.

Required cache behavior:

| Data Type | Cache Duration |
|---|---:|
| Quote data | 2 minutes |
| FX rate data | 15 minutes |
| Search results | 10 minutes |
| Historical chart data | 30 minutes |

Caching may be implemented with in-memory module-level cache inside Vercel Functions for MVP, with the understanding that serverless cache persistence is best-effort and not guaranteed across cold starts.

The frontend should also treat quote freshness explicitly:

| State | Meaning |
|---|---|
| Fresh | Updated within 2 minutes |
| Recent | Updated within 5 minutes |
| Stale | Older than 5 minutes |
| Unavailable | No valid quote |

---

### 14.6 Folder Structure

```txt
src/
  app/
    page.tsx
    dashboard/page.tsx
    browse/page.tsx
    asset/[symbol]/page.tsx
    portfolio/page.tsx
    learn/page.tsx
    learn/[slug]/page.tsx
    compound-growth/page.tsx
    settings/page.tsx
    auth/
      login/page.tsx
      callback/route.ts
    api/
      market/
        search/route.ts
        quote/route.ts
        history/route.ts
        fx/route.ts
      portfolio/
        sync/route.ts
  components/
    layout/
    dashboard/
    browse/
    trading/
    portfolio/
    learn/
    charts/
    education/
    common/
  content/
    learningTerms.ts
  lib/
    calculations/
    market-data/
    persistence/
    risk/
    diversification/
    currency/
    trading/
    compound/
    supabase/
      client.ts
      server.ts
      middleware.ts
      database.types.ts
  store/
    simulatorStore.ts
  types/
    market.ts
    portfolio.ts
    trading.ts
    education.ts
    learning.ts
```

---

### 14.3 Core Modules

#### Market Data Module

Responsibilities:

- Search symbols
- Fetch quotes
- Fetch historical prices
- Fetch FX rates
- Normalize Twelve Data responses
- Use mock data fallback

Interface:

```ts
interface MarketDataProvider {
  searchSymbols(query: string): Promise<AssetSearchResult[]>;
  getQuote(symbol: string): Promise<Quote>;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getHistoricalPrices(symbol: string, range: HistoricalRange): Promise<HistoricalPrice[]>;
  getExchangeRate(from: string, to: string): Promise<ExchangeRate>;
}
```

---

#### Portfolio Calculation Module

Responsibilities:

- Calculate holding market value
- Calculate cost basis
- Calculate unrealized gains/losses
- Calculate total portfolio value
- Calculate total return
- Calculate average cost
- Calculate realized gains/losses

---

#### Trading Module

Responsibilities:

- Validate buy orders
- Validate sell orders
- Estimate trade cost/proceeds
- Apply buy order
- Apply sell order
- Create transaction records

---

#### Diversification Module

Responsibilities:

- Calculate holding allocation
- Calculate sector allocation
- Calculate diversification score
- Generate score explanation
- Generate diversification warnings

---

#### Risk Module

Responsibilities:

- Detect concentration risk
- Detect sector concentration
- Detect all-in behavior
- Detect overtrading
- Detect panic selling
- Detect performance chasing

---

#### Persistence Module

Responsibilities:

- Load state from localStorage
- Save state to localStorage
- Validate saved state
- Reset simulation
- Handle corrupted state

---

#### Learning Content Module

Responsibilities:

- Store glossary/lesson content
- Support category filtering
- Support term lookup by slug
- Provide related terms
- Provide links from UI tooltips to term pages

Recommended content file:

```txt
src/content/learningTerms.ts
```

---

## 15. State Model

### 15.1 Root State

```ts
interface SimulatorState {
  version: number;
  user: LocalUser;
  simulation: SimulationConfig;
  portfolio: Portfolio;
  warnings: RiskWarning[];
  marketDataMode: 'API' | 'MOCK';
  createdAt: string;
  updatedAt: string;
}
```

---

### 15.2 User

```ts
interface LocalUser {
  id: string;
  displayName?: string;
}
```

---

### 15.3 Simulation Config

```ts
interface SimulationConfig {
  startingBalanceCad: number;
  baseCurrency: 'CAD';
  allowFractionalShares: true;
  allowCrypto: false;
  allowOptions: false;
  allowShortSelling: false;
  allowMargin: false;
  feesEnabled: false;
}
```

---

### 15.4 Portfolio

```ts
interface Portfolio {
  cashCad: number;
  startingBalanceCad: number;
  holdings: Holding[];
  transactions: Transaction[];
  snapshots: PortfolioSnapshot[];
  realizedGainLossCad: number;
}
```

---

### 15.5 Holding

```ts
interface Holding {
  symbol: string;
  assetName: string;
  assetType: 'STOCK' | 'ETF';
  exchange?: string;
  sector?: string;
  quantity: number;
  averageCostCad: number;
  currentPriceNative: number;
  currentPriceCad: number;
  nativeCurrency: string;
  fxRateToCad: number;
  lastQuoteAt: string;
}
```

---

### 15.6 Transaction

```ts
interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  assetName: string;
  assetType: 'STOCK' | 'ETF';
  quantity: number;
  priceNative: number;
  nativeCurrency: string;
  fxRateToCad: number;
  priceCad: number;
  totalCad: number;
  realizedGainLossCad?: number;
  timestamp: string;
  quoteTimestamp: string;
}
```

---

### 15.7 Portfolio Snapshot

```ts
interface PortfolioSnapshot {
  timestamp: string;
  totalValueCad: number;
  cashCad: number;
  investedValueCad: number;
  totalReturnCad: number;
  totalReturnPercent: number;
}
```

---

### 15.8 Risk Warning

```ts
interface RiskWarning {
  id: string;
  type: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  message: string;
  relatedSymbol?: string;
  relatedLearningSlugs?: string[];
  createdAt: string;
  acknowledged: boolean;
}
```

---

### 15.9 Learning Term

```ts
interface LearningTerm {
  slug: string;
  title: string;
  category: 'MARKET_BASICS' | 'PORTFOLIO_BASICS' | 'GAINS_LOSSES' | 'RISK_DIVERSIFICATION' | 'LONG_TERM_INVESTING' | 'SIMULATOR_CONCEPTS';
  shortDefinition: string;
  simpleDefinition: string;
  inSimulator: string;
  whyItMatters: string;
  example: string;
  relatedSlugs: string[];
}
```

---

## 16. Data Refresh Strategy

MVP refresh behavior:

```txt
On app load: refresh quotes for current holdings
On dashboard open: refresh quotes if older than 2 minutes
On portfolio open: refresh quotes if older than 2 minutes
On browse search: fetch quote/search data
Before trade confirmation: refresh quote if stale
Every 2–5 minutes: optionally refresh held assets while app is open
```

Quote freshness labels:

| State | Meaning |
|---|---|
| Fresh | Updated within 2 minutes |
| Recent | Updated within 5 minutes |
| Stale | Older than 5 minutes |
| Unavailable | No valid quote |

Historical chart behavior:

```txt
Asset detail historical charts use /api/market/history.
Default interval: 1day.
Default outputsize: 30.
```

Portfolio chart behavior:

```txt
Portfolio chart uses local PortfolioSnapshot[] only.
It does not reconstruct portfolio history from market data.
If fewer than 2 snapshots exist, show a helper empty state.
```

Sector chart behavior:

```txt
Sector allocation chart uses current portfolio allocation.
Cash is included as its own slice.
Missing sectors are grouped as Unknown.
```

---

## 17. UI Design System

### 17.1 Design Personality

The UI should feel:

```txt
Modern, educational, trustworthy, beginner-friendly, and lightly financial.
```

It should not feel:

```txt
Childish, casino-like, meme-stock themed, overly corporate, or intimidating.
```

---

### 17.2 Visual Hierarchy

Use this hierarchy:

1. Key metrics at top.
2. Charts and health/risk insights in the middle.
3. Tables/details below.
4. Learning links and explanations close to relevant terms.
5. Settings/destructive actions separated clearly.

---

### 17.3 Color Semantics

Use semantic colors:

| Purpose | Meaning |
|---|---|
| Success | Positive returns/gains |
| Danger | Negative returns/losses |
| Warning | Risk warnings |
| Info | Educational notes |
| Accent | Primary buttons and active nav |
| Neutral | Cash, unchanged values, labels |

Do not rely on color alone. Always include labels and numbers.

---

### 17.4 Typography

Recommended hierarchy:

| Element | Style |
|---|---|
| Page title | 28–36px, bold |
| Section title | 20–24px, semibold |
| Metric value | 24–32px, bold |
| Body | 14–16px |
| Table text | 13–15px |
| Tooltip/help | 12–14px |

Financial numbers should use tabular numerals where possible.

---

### 17.5 Common Components

Required common components:

- AppShell
- Header
- SidebarNav
- BottomNav
- MetricCard
- InfoTooltip
- LearningLink
- EmptyState
- LoadingState
- ErrorState
- ConfirmModal
- RiskPill
- ReturnValue
- CurrencyValue
- PercentValue

---

### 17.6 Page Components

Dashboard:

- DashboardSummaryCards
- PortfolioValueChartCard
- PortfolioHealthCard
- LatestWarningCard
- NextActionCard
- RecentTradesCard

Browse:

- AssetSearchBar
- AssetFilters
- AssetResultsTable
- AssetResultRow
- AssetTypeBadge
- QuoteChangeBadge

Trading:

- TradeTicket
- TradePreview
- TradeConfirmationModal
- RiskWarningInline
- OwnedPositionCard

Portfolio:

- PortfolioSummaryCards
- HoldingsTable
- HoldingRow
- SectorAllocationChart
- PortfolioHealthCard
- TransactionHistoryTable
- RealizedUnrealizedExplainer

Learn:

- LearningSearch
- LearningCategoryTabs
- LearningTermCard
- LearningTermDetail
- RelatedTerms

Compound Growth:

- CompoundInputForm
- CompoundSummaryCards
- CompoundGrowthChart
- CompoundDisclaimer

---

## 18. Technical Implementation Details

### 18.0 Supabase Integration Overview

Supabase is required in the MVP.

Supabase responsibilities:

```txt
Authentication
User profile storage
Portfolio persistence
Holding persistence
Transaction persistence
Portfolio snapshot persistence
Risk warning persistence
Optional learning progress persistence
Row Level Security for user-owned records
```

localStorage responsibilities:

```txt
Temporary client cache
Draft trade preview recovery
Last loaded portfolio fallback
Optimistic UI recovery if network fails
```

localStorage is not the source of truth. Supabase Postgres is the source of truth once a user is authenticated.

Required Supabase packages:

```txt
@supabase/supabase-js
@supabase/ssr
```

Required environment variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Rules:

```txt
NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY may be used by the browser.
SUPABASE_SERVICE_ROLE_KEY must only be used server-side.
Never expose SUPABASE_SERVICE_ROLE_KEY to client code.
```

---

### 18.0.1 Authentication Requirements

The MVP must include Supabase Auth.

Required auth flows:

```txt
Email/password sign up
Email/password login
Logout
Session persistence
Protected app routes
Auth callback handling
```

Optional but recommended:

```txt
Magic link login
```

Auth behavior:

```txt
Unauthenticated users can view landing/setup and Learn page.
Unauthenticated users must sign in before creating or saving a portfolio.
Authenticated users can access Dashboard, Browse, Portfolio, Compound Growth, and Settings.
```

After successful sign-up/login:

```txt
Create profile row if missing.
Create default portfolio row if missing.
Initialize portfolio with $5,000 CAD cash if no active portfolio exists.
Redirect to Dashboard.
```

---

### 18.0.2 Supabase Client Architecture

Required files:

```txt
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
src/lib/supabase/database.types.ts
```

Client-side Supabase client:

```txt
Used for authenticated user reads/writes allowed by RLS.
Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
```

Server-side Supabase client:

```txt
Used in Server Components, Route Handlers, and auth callback flows.
Uses cookies for SSR-compatible sessions.
```

Service-role client:

```txt
Only used in server-side code when absolutely required for admin/system operations.
Must never be imported into client components.
```

---

### 18.1 API Integration

The app must use Twelve Data through internal Next.js Route Handlers deployed on Vercel.

Components must not call Twelve Data directly.

Required internal routes:

```txt
/api/market/search
/api/market/quote
/api/market/history
/api/market/fx
```

Required provider implementations:

```txt
TwelveDataProvider
MockMarketDataProvider
CachedMarketDataProvider
```

The frontend market data client should call the internal API routes. The server-side route handlers should call Twelve Data.

Required API key rule:

```txt
The Twelve Data API key must be stored as TWELVE_DATA_API_KEY in Vercel environment variables.
The key must never be exposed with NEXT_PUBLIC_.
```

---

### 18.2 Asset Universe Rules

The MVP must support stocks and ETFs only.

Allowed MVP markets:

```txt
NASDAQ
NYSE
NYSE ARCA
TSX
```

Allowed currencies:

```txt
CAD
USD
```

Blocked/excluded assets:

```txt
Crypto
Options
Margin products
Short selling
Leveraged ETFs
Inverse ETFs
OTC stocks
Assets with unsupported currency
Assets with missing or invalid quote data
Assets without a valid symbol result
```

The app is designed for US and Canadian stocks/ETFs. Canadian quote availability may depend on the active Twelve Data plan/API key. If a supported Canadian asset cannot be retrieved from the API, the UI must show a clear quote unavailable state rather than failing silently.

---

### 18.3 Currency Conversion Rules

The base portfolio currency is CAD.

Currency rules:

```txt
CAD assets: fxRateToCad = 1
USD assets: use USD/CAD from /api/market/fx
Transactions store the FX rate used at execution time
Current portfolio value uses the latest available FX rate
If latest FX fails, use the last cached FX rate
If no FX rate exists, block non-CAD trades
```

Transaction history must preserve the execution FX rate so historical realized gains/losses remain explainable.

Current holdings may update in CAD value when current USD/CAD changes.

---

### 18.4 Mock Data

Mock data is required.

Reasons:

- Development without API dependency
- Avoid API rate limits
- Reliable demos
- Testing calculations

Mock data should include:

- Stocks
- ETFs
- CAD assets
- USD assets
- Sectors
- Price changes
- Historical price points
- FX rate examples

---

### 18.5 Persistence and Sync Rules

Supabase is the primary source of truth for authenticated users.

localStorage is a secondary cache only.

Required sync behavior:

```txt
On login: load active portfolio from Supabase.
On app load: load Supabase state first, then use localStorage only as fallback while loading or if offline.
After buy: write transaction/holding/portfolio/snapshot to Supabase, then update localStorage cache.
After sell: write transaction/holding/portfolio/snapshot to Supabase, then update localStorage cache.
After warning: persist warning to Supabase, then update localStorage cache.
After reset: reset Supabase portfolio state, then clear/update localStorage cache.
```

Conflict rule:

```txt
Supabase wins over localStorage when both are available.
localStorage may only be used to restore unsynced local changes if the app clearly indicates recovery is needed.
```

---

### 18.6 localStorage Persistence

Recommended key:

```txt
personal-stock-simulator-v1
```

Persistence rules:

- Save after setup.
- Save after every buy.
- Save after every sell.
- Save after acknowledging warnings.
- Save after changing settings.
- Save after reset.
- Validate loaded state.
- If state is corrupted, show recovery/reset option.

---

### 18.7 Error Handling

The app must handle:

- API unavailable
- API rate limit
- Invalid search query
- Quote unavailable
- FX unavailable
- Stale quote
- localStorage unavailable
- Corrupted localStorage data
- Invalid trade input
- Insufficient cash
- Sell quantity greater than owned

Example messages:

```txt
Price data is temporarily unavailable. Try again soon.
```

```txt
You do not have enough cash for this trade.
```

```txt
Your saved portfolio could not be loaded. You may need to reset the simulation.
```

---

### 18.8 Precision and Rounding

Money:

- Prefer storing money as cents internally in production.
- For MVP, decimal numbers are acceptable if carefully rounded.
- Display currency to 2 decimals.

Quantities:

- Store up to 6 decimal places.
- Display fewer decimals when possible.

Percentages:

- Display to 2 decimal places.

---

## 19. Implementation Phases

### Phase 1 — Core Simulator

Build first:

- localStorage state
- $5,000 CAD starting balance
- mock stock list
- buy logic
- sell logic
- portfolio table
- transaction history
- reset simulation

This proves the simulator works without relying on external API issues.

---

### Phase 2 — Market Data

Add:

- Twelve Data search
- Twelve Data quotes
- price refresh
- stale price handling
- CAD conversion
- mock/API toggle

---

### Phase 3 — Analytics

Add:

- total return
- realized/unrealized gains
- average cost
- portfolio value history
- Chart.js line chart
- per-holding analytics

---

### Phase 4 — Learning Layer

Add:

- Learning Center page
- glossary terms
- term detail pages/cards
- links from tooltips to learning terms
- diversification score
- sector pie chart
- risk warnings
- educational tooltips
- compound interest tool

---

## 20. Acceptance Criteria

### 20.1 Setup

- User can start a new simulation.
- User receives $5,000 CAD virtual cash.
- User can refresh the page and keep progress.
- User sees education-only disclaimer.

---

### 20.2 Buying

- User can search/select an asset.
- User can enter a fractional quantity.
- App estimates total CAD cost.
- App rejects buy if user lacks cash.
- App updates cash and holdings after buy.
- App records transaction.
- App recalculates portfolio analytics.
- App triggers risk warnings where applicable.

---

### 20.3 Selling

- User can sell an owned asset.
- App rejects sell quantity greater than owned quantity.
- App calculates estimated proceeds.
- App calculates realized gain/loss.
- App updates cash and holdings after sell.
- App records transaction.
- App recalculates portfolio analytics.

---

### 20.4 Portfolio

- App shows cash balance.
- App shows invested value.
- App shows total portfolio value.
- App shows total return.
- App shows holdings table.
- App shows realized and unrealized gains separately.
- App shows transaction history.
- App shows portfolio value chart.

---

### 20.5 Diversification and Risk

- App calculates diversification score.
- App shows score label.
- App shows sector allocation chart.
- App shows warnings for concentration risk.
- Warnings do not block trades.
- Warnings link to relevant learning terms when applicable.

---

### 20.6 Learning Center

- App includes a Learn page.
- Learn page lists beginner investing terms.
- Terms are grouped by category.
- User can open a term detail page/card.
- Each term has simple definition, simulator context, why it matters, example, and related terms.
- Important UI terms link to relevant Learn entries.

---

### 20.7 Compound Growth

- User can enter compound growth inputs.
- App calculates total contributed.
- App calculates estimated future value.
- App displays dual-line chart.
- App shows disclaimer.
- Compound Growth page links to relevant Learning Center terms.

---

### 20.8 Reset

- User can reset simulation.
- Reset requires confirmation.
- Reset clears holdings, transactions, warnings, and snapshots.
- Reset restores cash to $5,000 CAD.

---

## 21. Testing Plan

### 21.1 Unit Tests

Test:

- Buy validation
- Sell validation
- Average cost calculation
- Realized gain/loss calculation
- Unrealized gain/loss calculation
- Total portfolio value calculation
- Total return calculation
- Diversification score calculation
- Compound growth formula
- localStorage serialization/deserialization

---

### 21.2 Integration Tests

Test flows:

- Start simulation → buy → portfolio updates
- Buy existing holding → average cost updates
- Sell partial holding → realized gain updates
- Sell full holding → holding removed
- Refresh page → state restored
- Reset simulation → state cleared
- API unavailable → mock/error state works

---

### 21.3 UI/E2E Tests

Test:

- First launch setup
- Browse search
- Buy modal validation
- Sell modal validation
- Portfolio page rendering
- Learn page rendering
- Compound calculator interaction
- Settings reset confirmation

---

## 22. Success Metrics

Possible MVP success metrics:

- User completes first trade.
- User completes both buy and sell flows.
- User understands current portfolio value.
- User can distinguish realized and unrealized gains.
- User views diversification score.
- User triggers and reads at least one risk warning.
- User opens at least one Learning Center term.
- User uses compound growth tool.
- User returns after refresh and sees saved progress.

---

## 23. Future Scope After MVP

After the personal MVP works, future versions may add:

- User accounts
- Backend database
- Cloud persistence
- Teacher accounts
- Classrooms
- Class codes
- Classroom leaderboards
- Teacher dashboard
- Student portfolio sharing
- Teacher exports
- Reflection prompts
- Badges
- Multiple leaderboards
- Risk-adjusted rankings
- CSV export
- More advanced analytics
- Dividend simulation
- Corporate action handling
- Configurable starting balances
- Configurable trading fees
- Quizzes
- Course progress tracking
- Certificate/completion flow
- Videos or interactive lessons

---

## 24. Locked MVP Implementation Decisions

The following decisions are locked for the MVP and should not be treated as optional.

### 24.1 Framework and Deployment

```txt
Framework: Next.js App Router
Deployment: Vercel
Language: TypeScript
Styling: Tailwind CSS
State: Zustand
Charts: Chart.js via react-chartjs-2
Persistence: localStorage
Serverless API: Next.js Route Handlers
```

---

### 24.2 Market Data

```txt
Market provider: Twelve Data
Frontend calls: internal /api/market/* routes only
Server-side calls: Twelve Data from Next.js Route Handlers
API key storage: TWELVE_DATA_API_KEY in Vercel environment variables
Client exposure: forbidden
WebSockets: out of scope for MVP
```

Required internal routes:

```txt
/api/market/search
/api/market/quote
/api/market/history
/api/market/fx
```

Required Twelve Data endpoints:

```txt
symbol_search
quote
time_series
exchange_rate
```

---

### 24.3 Supported Assets

```txt
Allowed: stocks and ETFs
Allowed exchanges: NASDAQ, NYSE, NYSE ARCA, TSX
Allowed currencies: CAD, USD
```

Blocked:

```txt
Crypto
Options
Margin
Short selling
Leveraged ETFs
Inverse ETFs
OTC stocks
Unsupported currencies
Assets with missing quote data
```

---

### 24.4 Currency

```txt
Portfolio base currency: CAD
CAD assets: fxRateToCad = 1
USD assets: use USD/CAD from internal FX route
Each transaction stores execution FX rate
Current portfolio value uses latest available FX rate
If latest FX fails, use cached FX
If no FX exists, block non-CAD trade
```

---

### 24.5 Portfolio Accounting

```txt
Accounting method: average cost
Partial sell does not change averageCostCad
Realized G/L = quantitySold × (sellPriceCad - averageCostCad)
If remaining quantity <= 0.000001, close/remove holding
If quote refresh fails, use last known price and mark quote stale
Portfolio value may use stale prices only when clearly labeled stale
```

---

### 24.6 Charts

```txt
Portfolio chart: local snapshots only
Asset chart: Twelve Data time_series through /api/market/history
Asset chart default: interval=1day, outputsize=30
Sector chart: current allocation, includes cash and Unknown
Compound chart: yearly points, contributions-only vs compounded value
```

---

### 24.7 Reset Behavior

```txt
Reset keeps display name
Reset keeps selected data mode
Reset clears holdings
Reset clears transactions
Reset clears snapshots
Reset clears warnings
Reset restores cash to $5,000 CAD
After reset, return user to Dashboard
```

---

### 24.8 Mock/API Mode

```txt
Mock mode is required
API mode is required
Mode switch is visible in Settings
Switching modes after holdings exist requires confirmation
```

Reason: API mode proves real integration, while mock mode enables reliable demos, testing, and development when API limits or network failures occur.

---

### 24.9 Learning Center

```txt
Learning Center is required in MVP
Term detail pages/cards are required
Important UI labels must link to relevant terms
Trade modal learning links should open a side drawer or non-destructive detail view so trade input is not lost
```

Required MVP learning terms:

```txt
Stock
ETF
Share
Ticker Symbol
Stock Exchange
Market Price
Price Change
Portfolio
Cash Balance
Invested Value
Portfolio Value
Allocation
Average Cost
Cost Basis
Gain/Loss
Total Return
Realized Gain/Loss
Unrealized Gain/Loss
Return Percentage
Diversification
Concentration Risk
Sector Risk
Volatility
Risk vs. Reward
Going All-In
Compound Growth
Contribution
Annual Return
Time Horizon
Fractional Shares
```

Every term must include:

```txt
Simple definition
In the simulator
Why it matters
Example
Related terms
```

---

### 24.10 Risk Warning Lifecycle

```txt
Pre-trade warnings are temporary and shown in trade confirmation UI
Post-trade warnings are saved to warning history
Duplicate active warnings should be deduplicated
Acknowledged warnings remain in history
Acknowledged warnings should not show as active unless retriggered by a new trade or materially changed portfolio state
Warnings do not block trades
```

---

### 24.11 Theme

```txt
Theme: light mode only for MVP
Desktop navigation: sidebar
Mobile navigation: bottom nav
Visual style: modern educational fintech
```

---

## 25. Final MVP Boundary

The first MVP is successful if one user can:

1. Start with $5,000 CAD virtual cash.
2. Search for stocks/ETFs.
3. Buy and sell fractional shares.
4. See portfolio value update correctly.
5. Understand gains/losses.
6. See a persistent transaction history.
7. Refresh without losing progress.
8. View basic charts.
9. Receive basic diversification/risk feedback.
10. Learn important market terms from the Learning Center.
11. Use a compound growth tool.

Everything listed in this PRD as MVP scope is required. There is no optional MVP feature unless explicitly marked as future scope.

---

## 26. API Response Contracts

The frontend must not consume raw Twelve Data responses directly. Internal API routes must normalize responses into the app-specific contracts below.

All API responses should follow this envelope format:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
  cached?: boolean;
  fetchedAt: string;
};

type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  fetchedAt: string;
};
```

Frontend code must handle both success and error responses.

---

### 26.1 Search API

Route:

```txt
GET /api/market/search?q=
```

Purpose:

- Search supported stocks and ETFs by symbol or name.
- Normalize results.
- Filter unsupported asset types, currencies, and exchanges.

Response:

```ts
type AssetSearchResult = {
  symbol: string;
  name: string;
  assetType: 'STOCK' | 'ETF';
  exchange: 'NASDAQ' | 'NYSE' | 'NYSE ARCA' | 'TSX';
  currency: 'CAD' | 'USD';
  country?: string;
  micCode?: string;
  isSupported: boolean;
  unsupportedReason?: string;
};

type SearchResponse = ApiSuccess<AssetSearchResult[]> | ApiError;
```

Rules:

- Empty query should return an empty array, not an error.
- Unsupported results should either be filtered out or returned with `isSupported: false` and a clear reason.
- MVP UI should display supported assets only unless a debug/development view is enabled.

---

### 26.2 Quote API

Route:

```txt
GET /api/market/quote?symbol=&exchange=
```

Purpose:

- Fetch latest quote for a supported asset.
- Convert/normalize price fields.
- Return quote freshness metadata.

Response:

```ts
type QuoteResponseData = {
  symbol: string;
  name: string;
  assetType: 'STOCK' | 'ETF';
  exchange: 'NASDAQ' | 'NYSE' | 'NYSE ARCA' | 'TSX';
  currency: 'CAD' | 'USD';
  priceNative: number;
  changeNative?: number;
  changePercent?: number;
  previousCloseNative?: number;
  openNative?: number;
  highNative?: number;
  lowNative?: number;
  volume?: number;
  sector?: string;
  quoteTimestamp: string;
  freshness: 'FRESH' | 'RECENT' | 'STALE' | 'UNAVAILABLE';
};

type QuoteResponse = ApiSuccess<QuoteResponseData> | ApiError;
```

Rules:

- If no valid price exists, return `ok: false` with code `QUOTE_UNAVAILABLE`.
- If the asset is unsupported, return `ok: false` with code `UNSUPPORTED_ASSET`.
- If sector is unavailable, return `sector: 'Unknown'` or omit sector and let the frontend map it to `Unknown`.

---

### 26.3 Historical Price API

Route:

```txt
GET /api/market/history?symbol=&interval=1day&outputsize=30
```

Purpose:

- Fetch historical asset price data for the asset detail chart.

Response:

```ts
type HistoricalPricePoint = {
  timestamp: string;
  openNative: number;
  highNative: number;
  lowNative: number;
  closeNative: number;
  volume?: number;
};

type HistoricalPriceResponse = ApiSuccess<{
  symbol: string;
  interval: '1day';
  points: HistoricalPricePoint[];
}> | ApiError;
```

Rules:

- MVP default interval is `1day`.
- MVP default output size is `30`.
- If fewer than 2 points are returned, the chart should show an insufficient-data empty state.

---

### 26.4 FX API

Route:

```txt
GET /api/market/fx?from=USD&to=CAD
```

Purpose:

- Fetch exchange rate for USD/CAD conversion.

Response:

```ts
type FxResponseData = {
  from: 'USD' | 'CAD';
  to: 'CAD';
  rate: number;
  timestamp: string;
  freshness: 'FRESH' | 'RECENT' | 'STALE' | 'UNAVAILABLE';
};

type FxResponse = ApiSuccess<FxResponseData> | ApiError;
```

Rules:

- `CAD → CAD` should return rate `1` locally without requiring an external API call.
- If `USD → CAD` fails and no cached FX exists, block non-CAD trades.
- If cached FX exists, allow trade only if the UI clearly labels that cached FX is being used.

---

### 26.5 Standard API Error Codes

Use these normalized error codes:

```txt
MISSING_QUERY
INVALID_SYMBOL
UNSUPPORTED_ASSET
UNSUPPORTED_EXCHANGE
UNSUPPORTED_CURRENCY
QUOTE_UNAVAILABLE
HISTORY_UNAVAILABLE
FX_UNAVAILABLE
RATE_LIMITED
TWELVE_DATA_ERROR
NETWORK_ERROR
UNKNOWN_ERROR
```

Each error response must include a beginner-friendly message suitable for display.

---

## 27. Store Actions and Selectors

The MVP must use Zustand for simulator state.

The store should keep persistent simulator state and expose actions/selectors for UI components. Components should not directly mutate localStorage or portfolio objects.

---

### 27.1 Store State

```ts
type SimulatorStoreState = {
  version: number;
  user: LocalUser | null;
  authSessionStatus: 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';
  simulation: SimulationConfig;
  portfolio: Portfolio;
  warnings: RiskWarning[];
  marketDataMode: 'API' | 'MOCK';
  syncStatus: 'SYNCED' | 'SYNCING' | 'UNSYNCED' | 'ERROR';
  createdAt: string;
  updatedAt: string;
};
```

---

### 27.2 Required Store Actions

```ts
type SimulatorStoreActions = {
  initializeSimulation(displayName?: string): Promise<void>;
  loadState(): Promise<void>;
  saveState(): Promise<void>;
  syncFromSupabase(): Promise<void>;
  syncToSupabase(): Promise<void>;
  resetSimulation(): Promise<void>;

  setDisplayName(displayName: string): void;
  setMarketDataMode(mode: 'API' | 'MOCK'): void;

  searchAssets(query: string): Promise<AssetSearchResult[]>;
  getQuote(symbol: string, exchange?: string): Promise<QuoteResponseData>;
  refreshHoldingQuotes(): Promise<void>;
  refreshFxRate(from: 'USD', to: 'CAD'): Promise<FxResponseData>;

  previewBuy(order: BuyOrderInput): Promise<TradePreview>;
  executeBuy(preview: TradePreview): Promise<TradeResult>;
  previewSell(order: SellOrderInput): Promise<TradePreview>;
  executeSell(preview: TradePreview): Promise<TradeResult>;

  acknowledgeWarning(warningId: string): void;
  clearInactiveWarnings(): void;
};
```

---

### 27.3 Required Selectors

```ts
type SimulatorSelectors = {
  selectCashCad(state: SimulatorStoreState): number;
  selectInvestedValueCad(state: SimulatorStoreState): number;
  selectPortfolioValueCad(state: SimulatorStoreState): number;
  selectTotalReturnCad(state: SimulatorStoreState): number;
  selectTotalReturnPercent(state: SimulatorStoreState): number;
  selectRealizedGainLossCad(state: SimulatorStoreState): number;
  selectUnrealizedGainLossCad(state: SimulatorStoreState): number;
  selectHoldingsWithAnalytics(state: SimulatorStoreState): HoldingWithAnalytics[];
  selectRecentTransactions(state: SimulatorStoreState): Transaction[];
  selectPortfolioSnapshots(state: SimulatorStoreState): PortfolioSnapshot[];
  selectDiversificationResult(state: SimulatorStoreState): DiversificationResult;
  selectActiveWarnings(state: SimulatorStoreState): RiskWarning[];
  selectAcknowledgedWarnings(state: SimulatorStoreState): RiskWarning[];
};
```

---

### 27.4 Trade Input and Preview Types

```ts
type BuyOrderInput = {
  symbol: string;
  exchange?: string;
  quantity: number;
};

type SellOrderInput = {
  symbol: string;
  quantity: number;
};

type TradePreview = {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  assetName: string;
  assetType: 'STOCK' | 'ETF';
  quantity: number;
  priceNative: number;
  nativeCurrency: 'CAD' | 'USD';
  fxRateToCad: number;
  priceCad: number;
  totalCad: number;
  estimatedCashAfterCad: number;
  estimatedRealizedGainLossCad?: number;
  quoteTimestamp: string;
  warnings: RiskWarning[];
};

type TradeResult = {
  success: boolean;
  transaction?: Transaction;
  errors?: string[];
};
```

---

## 28. Final Learning Term Content

The Learning Center must ship with the following MVP terms. Each term must follow the same structure so it can be rendered consistently.

Source guidance should be based on reputable investor education sources such as Investor.gov, Ontario Securities Commission/GetSmarterAboutMoney, and CIRO, but copy must be original, beginner-friendly, and tailored to the simulator.

---

### 28.1 Market Basics

#### Stock

```txt
Simple definition:
A stock is a small piece of ownership in a company.

In the simulator:
When you buy a stock, your virtual portfolio owns virtual shares of that company.

Why it matters:
The value of your holding changes when the stock price changes.

Example:
You buy 2 shares at $100 each. Later the price rises to $110. Your shares are now worth $220, giving you an unrealized gain of $20.

Related terms:
Share, Market Price, Portfolio, Unrealized Gain/Loss
```

#### ETF

```txt
Simple definition:
An ETF is a fund that trades like a stock and usually holds a basket of investments.

In the simulator:
Buying an ETF lets your portfolio get exposure to many investments through one ticker.

Why it matters:
ETFs can make diversification easier than buying many individual stocks yourself.

Example:
Instead of buying 20 companies one by one, you buy one broad-market ETF that holds many companies.

Related terms:
Diversification, Portfolio, Stock Exchange, Allocation
```

#### Share

```txt
Simple definition:
A share is one unit of ownership in a stock or ETF.

In the simulator:
Your quantity shows how many shares, including fractional shares, you virtually own.

Why it matters:
The number of shares multiplied by the current price determines the holding value.

Example:
If you own 1.5 shares and each share is worth $100 CAD, your holding is worth $150 CAD.

Related terms:
Stock, ETF, Fractional Shares, Market Price
```

#### Ticker Symbol

```txt
Simple definition:
A ticker symbol is a short code used to identify a stock or ETF.

In the simulator:
You search for assets using ticker symbols like AAPL, MSFT, or VFV.TO.

Why it matters:
Ticker symbols help avoid confusion between companies or funds with similar names.

Example:
Apple Inc. uses the ticker AAPL on NASDAQ.

Related terms:
Stock Exchange, Stock, ETF
```

#### Stock Exchange

```txt
Simple definition:
A stock exchange is a marketplace where stocks and ETFs are bought and sold.

In the simulator:
Supported exchanges include NASDAQ, NYSE, NYSE ARCA, and TSX.

Why it matters:
The exchange helps determine where the asset trades, what currency it uses, and whether the simulator supports it.

Example:
AAPL trades on NASDAQ. Many Canadian stocks trade on TSX.

Related terms:
Ticker Symbol, Market Price, Currency Conversion
```

#### Market Price

```txt
Simple definition:
Market price is the latest available price of a stock or ETF.

In the simulator:
Trades execute using the latest available quote shown by the app.

Why it matters:
The price determines how much it costs to buy and how much you receive when selling.

Example:
If the market price is $50 and you buy 2 shares, the estimated cost is $100 before currency conversion.

Related terms:
Price Change, Quote, Gain/Loss
```

#### Price Change

```txt
Simple definition:
Price change shows how much an asset's price has moved over a period of time.

In the simulator:
The Browse and Asset Detail screens may show daily change as dollars and/or percent.

Why it matters:
Price changes affect your portfolio value and gains/losses.

Example:
If a stock rises from $100 to $105, the price change is +$5 or +5%.

Related terms:
Market Price, Return Percentage, Gain/Loss
```

---

### 28.2 Portfolio Basics

#### Portfolio

```txt
Simple definition:
A portfolio is the full collection of your cash and investments.

In the simulator:
Your portfolio includes virtual cash, stocks, ETFs, transaction history, and performance.

Why it matters:
Your total portfolio value shows the combined result of all your decisions.

Example:
If you have $1,000 cash and $4,200 in holdings, your portfolio value is $5,200.

Related terms:
Cash Balance, Invested Value, Portfolio Value, Allocation
```

#### Cash Balance

```txt
Simple definition:
Cash balance is the virtual money you have not invested yet.

In the simulator:
Buying reduces cash. Selling increases cash.

Why it matters:
Cash lets you make future trades, but cash alone does not rise or fall with stock prices.

Example:
You start with $5,000 CAD. If you buy $1,200 of stocks, your cash becomes $3,800.

Related terms:
Portfolio, Invested Value, Buy, Sell
```

#### Invested Value

```txt
Simple definition:
Invested value is the current market value of the assets you own.

In the simulator:
It is calculated from your holdings, not your cash.

Why it matters:
Invested value shows how much of your portfolio is exposed to market movement.

Example:
If your stocks and ETFs are currently worth $3,400, your invested value is $3,400.

Related terms:
Portfolio Value, Cash Balance, Allocation
```

#### Portfolio Value

```txt
Simple definition:
Portfolio value is your cash plus the current value of your holdings.

In the simulator:
This is the main number used to show how your virtual account is doing.

Why it matters:
It combines both uninvested cash and invested assets into one total.

Example:
$900 cash + $4,300 holdings = $5,200 portfolio value.

Related terms:
Cash Balance, Invested Value, Total Return
```

#### Allocation

```txt
Simple definition:
Allocation shows how your portfolio is divided across assets, sectors, or cash.

In the simulator:
The sector pie chart and holdings table show allocation percentages.

Why it matters:
Allocation helps you see whether your portfolio is diversified or concentrated.

Example:
If $3,000 of a $5,000 portfolio is in one stock, that stock has a 60% allocation.

Related terms:
Diversification, Concentration Risk, Sector Risk
```

#### Average Cost

```txt
Simple definition:
Average cost is the average price you paid per share for a holding.

In the simulator:
When you buy more of the same asset, the app recalculates average cost.

Why it matters:
Average cost is used to estimate your gain or loss when the price changes or when you sell.

Example:
You buy 1 share at $100 and another at $120. Your average cost is $110.

Related terms:
Cost Basis, Realized Gain/Loss, Unrealized Gain/Loss
```

#### Cost Basis

```txt
Simple definition:
Cost basis is the total amount you paid for an investment.

In the simulator:
Cost basis is calculated using quantity multiplied by average cost.

Why it matters:
Gains and losses are measured by comparing current or sale value against cost basis.

Example:
If you own 3 shares with an average cost of $50, your cost basis is $150.

Related terms:
Average Cost, Gain/Loss, Realized Gain/Loss
```

---

### 28.3 Gains and Losses

#### Gain/Loss

```txt
Simple definition:
A gain means an investment is worth more than you paid. A loss means it is worth less.

In the simulator:
The portfolio page shows gains and losses for each holding and for the whole portfolio.

Why it matters:
Gain/loss helps you understand whether your investing decisions increased or decreased value.

Example:
You buy at $100 and the value becomes $115. Your gain is $15.

Related terms:
Realized Gain/Loss, Unrealized Gain/Loss, Total Return
```

#### Total Return

```txt
Simple definition:
Total return shows how much your whole portfolio has gained or lost compared to the starting balance.

In the simulator:
Total return compares your current portfolio value to the starting $5,000 CAD.

Why it matters:
It gives one overall measure of portfolio performance.

Example:
If your portfolio is worth $5,300, your total return is +$300 or +6%.

Related terms:
Portfolio Value, Return Percentage, Gain/Loss
```

#### Realized Gain/Loss

```txt
Simple definition:
A realized gain or loss happens when you sell an investment.

In the simulator:
Selling locks in the difference between your sale price and your average cost.

Why it matters:
It separates gains/losses you have locked in from changes on investments you still own.

Example:
You bought at $100 and sold at $120. Your realized gain is $20.

Related terms:
Unrealized Gain/Loss, Average Cost, Cost Basis
```

#### Unrealized Gain/Loss

```txt
Simple definition:
An unrealized gain or loss is the gain or loss on something you still own.

In the simulator:
The portfolio page shows unrealized gain/loss for current holdings.

Why it matters:
It can change as prices move because you have not sold yet.

Example:
You bought at $100 and the current price is $110. You have a $10 unrealized gain until you sell.

Related terms:
Realized Gain/Loss, Market Price, Holding
```

#### Return Percentage

```txt
Simple definition:
Return percentage shows gain or loss compared to the amount invested or starting balance.

In the simulator:
It helps compare performance across holdings or the whole portfolio.

Why it matters:
Percent return is easier to compare than dollar return when investments are different sizes.

Example:
A $10 gain on $100 is a 10% return. A $10 gain on $1,000 is a 1% return.

Related terms:
Total Return, Gain/Loss, Portfolio Value
```

---

### 28.4 Risk and Diversification

#### Diversification

```txt
Simple definition:
Diversification means spreading investments across different assets or sectors.

In the simulator:
The diversification score and sector chart show how spread out your portfolio is.

Why it matters:
Diversification can reduce the impact of one company or sector performing badly.

Example:
Owning five companies in different sectors is usually more diversified than putting everything into one stock.

Related terms:
Concentration Risk, Sector Risk, Allocation
```

#### Concentration Risk

```txt
Simple definition:
Concentration risk happens when too much of your portfolio depends on one investment.

In the simulator:
The app warns you if one holding becomes a large percentage of your portfolio.

Why it matters:
If that one investment drops, your whole portfolio can be hurt badly.

Example:
If 75% of your portfolio is in one stock, one bad day for that stock can strongly affect your results.

Related terms:
Diversification, Allocation, Going All-In
```

#### Sector Risk

```txt
Simple definition:
Sector risk happens when too much of your portfolio is invested in one industry or sector.

In the simulator:
The sector pie chart shows how much of your portfolio is in each sector.

Why it matters:
Companies in the same sector can fall together when that industry has problems.

Example:
If most of your portfolio is in technology stocks, a technology downturn may affect many holdings at once.

Related terms:
Diversification, Allocation, Concentration Risk
```

#### Volatility

```txt
Simple definition:
Volatility means how much an investment's price moves up and down.

In the simulator:
Assets with large price swings may change your portfolio value quickly.

Why it matters:
Higher volatility can create larger gains, but also larger losses.

Example:
A stock that moves 8% in a day is more volatile than one that usually moves 1%.

Related terms:
Risk vs. Reward, Price Change, Gain/Loss
```

#### Risk vs. Reward

```txt
Simple definition:
Risk vs. reward means investments with higher possible reward often come with higher possible downside.

In the simulator:
Risk warnings help you see when your choices may increase downside risk.

Why it matters:
A high return is not the only thing that matters. The amount of risk taken matters too.

Example:
Putting everything into one fast-moving stock could lead to a big gain or a big loss.

Related terms:
Volatility, Concentration Risk, Diversification
```

#### Going All-In

```txt
Simple definition:
Going all-in means putting almost all your cash or portfolio into one investment or idea.

In the simulator:
The app warns you if a trade leaves almost no cash or creates extreme concentration.

Why it matters:
Going all-in can make your portfolio very sensitive to one outcome.

Example:
If you use all $5,000 to buy one stock, your whole result depends on that stock.

Related terms:
Concentration Risk, Cash Balance, Diversification
```

---

### 28.5 Long-Term Investing and Simulator Concepts

#### Compound Growth

```txt
Simple definition:
Compound growth happens when gains begin to generate their own gains over time.

In the simulator:
The compound growth tool shows how contributions plus growth can increase over many years.

Why it matters:
Time can make a large difference because growth can build on previous growth.

Example:
If money grows by 7% in one year, the next year can grow on the original money plus the first year's growth.

Related terms:
Contribution, Annual Return, Time Horizon
```

#### Contribution

```txt
Simple definition:
A contribution is money added to an investment account over time.

In the simulator:
The compound growth tool lets you enter a monthly contribution.

Why it matters:
Regular contributions can become a major part of long-term investing results.

Example:
Contributing $200 per month for 10 years adds $24,000 before investment growth.

Related terms:
Compound Growth, Time Horizon, Annual Return
```

#### Annual Return

```txt
Simple definition:
Annual return is the percentage an investment grows or shrinks over one year.

In the simulator:
The compound tool uses annual return as an estimate, not a guarantee.

Why it matters:
Small changes in annual return can create large differences over long periods.

Example:
A 5% annual return and an 8% annual return can lead to very different results after 30 years.

Related terms:
Compound Growth, Return Percentage, Time Horizon
```

#### Time Horizon

```txt
Simple definition:
Time horizon is how long money stays invested before it is needed.

In the simulator:
The compound tool lets you choose the number of years invested.

Why it matters:
A longer time horizon gives compounding more time to work, but returns are never guaranteed.

Example:
Investing for 40 years gives growth much more time than investing for 5 years.

Related terms:
Compound Growth, Contribution, Annual Return
```

#### Fractional Shares

```txt
Simple definition:
Fractional shares let you buy less than one full share.

In the simulator:
You can buy quantities like 0.5 or 1.25 shares.

Why it matters:
Fractional shares make it easier to invest small amounts and diversify.

Example:
If one share costs $400, buying 0.25 shares costs about $100 before currency conversion.

Related terms:
Share, Stock, ETF, Diversification
```

---

## 29. Exact Table Column Specifications

### 29.1 Browse Results Table

Columns:

| Column | Required | Notes |
|---|---|---|
| Symbol | Yes | Ticker symbol |
| Name | Yes | Company/fund name |
| Type | Yes | Stock or ETF |
| Exchange | Yes | NASDAQ, NYSE, NYSE ARCA, TSX |
| Currency | Yes | CAD or USD |
| Price | Yes | Latest native price if available |
| Change % | Yes | If available; show `—` if missing |
| Status | Yes | Fresh, Stale, Unavailable |
| Action | Yes | View/Buy button |

---

### 29.2 Holdings Table

Columns:

| Column | Required | Notes |
|---|---|---|
| Symbol | Yes | Ticker |
| Name | Yes | Asset name |
| Type | Yes | Stock or ETF |
| Sector | Yes | Use Unknown if missing |
| Quantity | Yes | Up to 6 decimals internally; readable display |
| Average Cost CAD | Yes | Average cost converted to CAD |
| Current Price CAD | Yes | Latest CAD price |
| Market Value CAD | Yes | Quantity × current CAD price |
| Unrealized G/L CAD | Yes | Current value - cost basis |
| Unrealized G/L % | Yes | G/L divided by cost basis |
| Allocation % | Yes | Holding value / portfolio value |
| Quote Status | Yes | Fresh, Recent, Stale, Unavailable |
| Actions | Yes | Buy more, Sell |

---

### 29.3 Transaction History Table

Columns:

| Column | Required | Notes |
|---|---|---|
| Date/Time | Yes | Local display format |
| Type | Yes | Buy or Sell |
| Symbol | Yes | Ticker |
| Quantity | Yes | Shares/units |
| Price Native | Yes | Execution price in native currency |
| FX Rate | Yes | 1 for CAD; USD/CAD for USD assets |
| Total CAD | Yes | Trade total in CAD |
| Realized G/L CAD | Yes for sells | Show `—` for buys |
| Quote Timestamp | Yes | Quote used for execution |

---

### 29.4 Warning History Table or List

If warning history is displayed, each warning must show:

| Field | Required |
|---|---|
| Timestamp | Yes |
| Severity | Yes |
| Title | Yes |
| Message | Yes |
| Related Symbol | If applicable |
| Related Learn Terms | If applicable |
| Acknowledged State | Yes |

---

## 30. Empty, Loading, and Error States

Every major feature must have explicit empty, loading, and error states.

---

### 30.1 Setup States

Error states:

```txt
Display name is too long.
Display name contains invalid characters.
Unable to save simulation. Your browser may be blocking localStorage.
```

---

### 30.2 Browse States

Empty states:

```txt
Search for a stock or ETF to begin.
No matching supported stocks or ETFs found.
```

Loading state:

```txt
Searching market data...
```

Error states:

```txt
Market search is temporarily unavailable.
The market data provider rate limit was reached. Try mock mode or try again later.
```

---

### 30.3 Asset Detail States

Loading state:

```txt
Loading quote...
```

Error states:

```txt
Quote unavailable for this asset.
This asset is not supported by the simulator.
This asset uses an unsupported currency.
```

---

### 30.4 Portfolio States

Empty state:

```txt
You do not own any stocks or ETFs yet. Browse assets to make your first virtual trade.
```

Chart empty state:

```txt
Your portfolio chart will appear after more portfolio snapshots are recorded.
```

Error states:

```txt
Some quotes could not be refreshed. Stale prices are being shown.
```

---

### 30.5 Trade Modal States

Error states:

```txt
Enter a quantity greater than 0.
You do not have enough cash for this trade.
You cannot sell more shares than you own.
Currency conversion is unavailable, so this trade cannot be completed.
The price changed. Review the updated trade before confirming.
```

Loading states:

```txt
Refreshing quote...
Preparing trade preview...
Executing trade...
```

---

### 30.6 Learning Center States

Empty state:

```txt
No learning terms match your search.
```

Error state:

```txt
Learning term not found.
```

---

### 30.7 Settings and Persistence States

Error states:

```txt
Saved simulator data could not be loaded.
Saved simulator data appears corrupted.
Reset simulation to recover.
```

Mode switch warning:

```txt
Switching data modes may change displayed prices for your holdings. Your transaction history will remain unchanged.
```

---

## 31. Final Interaction Rules

### 31.1 Buy Interaction

Required flow:

```txt
User selects asset
→ User enters quantity
→ App calculates estimate
→ User clicks Preview Trade
→ App refreshes quote if stale
→ If price changed, show updated estimate
→ Confirmation modal opens
→ Risk warnings are shown inside modal
→ User confirms
→ Trade executes
→ Portfolio updates
→ Transaction saved
→ Snapshot saved
→ Warnings saved if applicable
```

---

### 31.2 Sell Interaction

Required flow:

```txt
User selects owned asset
→ User enters quantity
→ App validates quantity owned
→ User clicks Preview Sell
→ App refreshes quote if stale
→ App calculates proceeds and realized G/L
→ Confirmation modal opens
→ Risk warnings are shown if applicable
→ User confirms
→ Trade executes
→ Cash and holdings update
→ Transaction saved
→ Snapshot saved
```

---

### 31.3 Learning Links

Rules:

```txt
Learning links outside modals navigate to /learn/[slug]
Learning links inside trade modals open a right-side drawer or non-destructive panel
Opening a learning link inside a modal must not clear trade input
Closing the drawer returns the user to the exact trade state
```

---

### 31.4 Reset Interaction

Required flow:

```txt
User opens Settings
→ User clicks Reset Simulation
→ Confirmation modal appears
→ Modal explains what will be cleared and what will remain
→ User confirms
→ Portfolio resets to $5,000 CAD cash
→ Display name and data mode remain
→ User returns to Dashboard
```

---

### 31.5 Mock/API Mode Switch

Required flow:

```txt
User opens Settings
→ User selects different data mode
→ If user has no holdings, switch immediately
→ If user has holdings, show confirmation warning
→ If confirmed, switch mode and refresh quotes
→ Existing transaction history remains unchanged
```

---

## 32. Design Tokens

The MVP uses a single polished light theme.

### 32.1 Color Tokens

Use Tailwind-compatible tokens:

```txt
App background: slate-50
Surface/card: white
Muted surface: slate-100
Border: slate-200
Text primary: slate-900
Text secondary: slate-600
Text muted: slate-500
Primary/accent: blue-600
Primary hover: blue-700
Success: green-600
Danger: red-600
Warning: amber-500
Info: sky-600
Neutral badge: slate-200 / slate-700
```

---

### 32.2 Spacing and Layout

```txt
Page max width: 1280px
Desktop page padding: 24px
Mobile page padding: 16px
Card padding desktop: 24px
Card padding mobile: 16px
Section gap: 24px
Card gap: 16px
```

---

### 32.3 Borders and Shadows

```txt
Card radius: rounded-xl
Modal radius: rounded-2xl
Button radius: rounded-lg
Card border: 1px solid slate-200
Card shadow: shadow-sm
Modal shadow: shadow-xl
```

---

### 32.4 Buttons

Button variants:

```txt
Primary: blue background, white text
Secondary: white background, slate border, slate text
Ghost: transparent background, slate text
Danger: red background, white text
Success: green background, white text
```

Disabled buttons:

```txt
Opacity reduced
Cursor disabled
Do not rely only on color; include disabled behavior and validation text
```

---

### 32.5 Tables

Table style:

```txt
Container: white card, border, rounded-xl
Header: slate-50 background, slate-600 text
Rows: white background, subtle hover slate-50
Cell padding: 12px vertical, 16px horizontal
Numeric columns: right aligned
Actions: right aligned
```

---

### 32.6 Charts

Chart rules:

```txt
Use Chart.js
Use semantic colors from the design system
Always include labels/legends
Do not rely on color alone
Show empty state if insufficient data
Show CAD axis labels for money charts
```

---

## 33. Phase-by-Phase Definition of Done

### 33.1 Phase 1 — Core Simulator

Done when:

- User can start a simulation.
- $5,000 CAD virtual cash is created.
- Mock assets are available.
- User can buy fractional shares with mock data.
- User can sell partial and full holdings.
- Cash updates correctly.
- Holdings update correctly.
- Average cost is calculated correctly.
- Transaction history is recorded.
- State persists after refresh.
- Reset works.
- Unit tests cover buy/sell/accounting logic.

---

### 33.2 Phase 2 — Market Data and Vercel API Routes

Done when:

- Next.js API routes exist for search, quote, history, and FX.
- API key is stored server-side only.
- Frontend does not call Twelve Data directly.
- Search works through internal route.
- Quote works through internal route.
- FX works through internal route.
- Historical data works through internal route.
- API errors are normalized.
- Cache rules are implemented.
- API/mock mode switching works.

---

### 33.3 Phase 3 — Analytics and Charts

Done when:

- Total portfolio value is correct.
- Invested value is correct.
- Total return is correct.
- Realized and unrealized gains are correct.
- Portfolio snapshots are recorded.
- Portfolio value chart renders.
- Sector allocation chart renders.
- Asset detail historical chart renders.
- Tables display all required columns.
- Empty/loading/error states are implemented.

---

### 33.4 Phase 4 — Learning and Risk Layer

Done when:

- Learning Center page exists.
- All required learning terms are implemented.
- Term detail pages/cards render correctly.
- UI labels link to relevant terms.
- Trade modal learning links open non-destructively.
- Diversification score is calculated.
- Risk warnings trigger correctly.
- Risk warning lifecycle works.
- Compound growth tool works.
- Compound chart renders.
- E2E tests cover core flows.

---

## 34. Supabase Backend and Database Specification

Supabase is required for the MVP. The database must persist all user-owned simulator data needed to restore the app across devices and sessions.

---

### 34.1 Required Tables

Required tables:

```txt
profiles
portfolios
holdings
transactions
portfolio_snapshots
risk_warnings
learning_progress
```

Optional future tables:

```txt
classes
class_memberships
teacher_settings
leaderboard_snapshots
assignments
reflection_submissions
```

Classroom tables are out of scope for this personal MVP.

---

### 34.2 profiles

Purpose:

```txt
Stores public/basic user profile data linked to Supabase Auth users.
```

Schema:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Rules:

```txt
One profile per auth user.
User can read/update only their own profile.
```

---

### 34.3 portfolios

Purpose:

```txt
Stores the user's active simulator portfolio.
```

Schema:

```sql
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
```

Rules:

```txt
MVP uses one active portfolio per user.
Reset updates this row and clears dependent data.
Future versions may support multiple portfolios.
```

Recommended unique partial index:

```sql
create unique index one_active_portfolio_per_user
on public.portfolios(user_id)
where is_active = true;
```

---

### 34.4 holdings

Purpose:

```txt
Stores current open holdings.
```

Schema:

```sql
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
```

Rules:

```txt
A holding is removed when quantity <= 0.000001.
Partial sells do not change average_cost_cad.
```

Recommended indexes:

```sql
create index holdings_portfolio_id_idx on public.holdings(portfolio_id);
create index holdings_user_id_idx on public.holdings(user_id);
```

---

### 34.5 transactions

Purpose:

```txt
Stores immutable buy/sell transaction history.
```

Schema:

```sql
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
```

Rules:

```txt
Transactions are append-only from the normal app UI.
Reset may delete transactions for the active portfolio.
```

Recommended index:

```sql
create index transactions_portfolio_id_created_at_idx
on public.transactions(portfolio_id, created_at desc);
```

---

### 34.6 portfolio_snapshots

Purpose:

```txt
Stores historical portfolio values for the portfolio value chart.
```

Schema:

```sql
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
```

Recommended index:

```sql
create index portfolio_snapshots_portfolio_id_created_at_idx
on public.portfolio_snapshots(portfolio_id, created_at asc);
```

---

### 34.7 risk_warnings

Purpose:

```txt
Stores user risk warning history and acknowledgement state.
```

Schema:

```sql
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
```

Recommended index:

```sql
create index risk_warnings_portfolio_id_created_at_idx
on public.risk_warnings(portfolio_id, created_at desc);
```

---

### 34.8 learning_progress

Purpose:

```txt
Stores lightweight progress for Learning Center terms.
```

Schema:

```sql
create table public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  term_slug text not null,
  viewed boolean not null default true,
  viewed_at timestamptz not null default now(),
  unique(user_id, term_slug)
);
```

Rules:

```txt
When a user opens a term detail page/card, upsert a learning_progress row.
Learning progress is not required for grading in MVP.
```

---

### 34.9 Row Level Security Requirements

RLS must be enabled on every public table containing user data:

```sql
alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.holdings enable row level security;
alter table public.transactions enable row level security;
alter table public.portfolio_snapshots enable row level security;
alter table public.risk_warnings enable row level security;
alter table public.learning_progress enable row level security;
```

Policy rule:

```txt
Users can only select, insert, update, and delete rows where user_id = auth.uid(), or where profile id = auth.uid().
```

Example portfolio policies:

```sql
create policy "Users can read own portfolios"
on public.portfolios for select
using (user_id = auth.uid());

create policy "Users can insert own portfolios"
on public.portfolios for insert
with check (user_id = auth.uid());

create policy "Users can update own portfolios"
on public.portfolios for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own portfolios"
on public.portfolios for delete
using (user_id = auth.uid());
```

Equivalent policies must be created for holdings, transactions, portfolio_snapshots, risk_warnings, and learning_progress.

---

### 34.10 Supabase Reset Behavior

When the user resets the simulation:

```txt
Keep profile row.
Keep auth user.
Keep display name.
Keep selected market data mode if stored.
Reset portfolio cash to $5,000 CAD.
Reset realized_gain_loss_cad to 0.
Delete holdings for active portfolio.
Delete transactions for active portfolio.
Delete portfolio snapshots for active portfolio.
Delete risk warnings for active portfolio.
Create a new initial portfolio snapshot.
Keep learning_progress unless user explicitly clears learning progress in a future feature.
```

---

### 34.11 Supabase and Zustand Sync

Required behavior:

```txt
Zustand powers immediate UI state.
Supabase persists durable state.
After successful Supabase writes, Zustand updates syncStatus to SYNCED.
If Supabase write fails, Zustand updates syncStatus to ERROR and keeps local recovery data.
The UI must show when portfolio changes are not synced.
```

Sync status labels:

```txt
SYNCED: Saved
SYNCING: Saving...
UNSYNCED: Unsaved changes
ERROR: Save failed
```

---

### 34.12 Supabase Acceptance Criteria

Supabase integration is complete when:

- User can sign up.
- User can log in.
- User can log out.
- App creates profile row if missing.
- App creates default portfolio if missing.
- Buy trade persists to portfolios, holdings, transactions, and snapshots.
- Sell trade persists to portfolios, holdings, transactions, and snapshots.
- Risk warnings persist.
- Learning progress persists when terms are viewed.
- Refreshing the browser restores state from Supabase.
- Logging in on another device restores the same portfolio.
- RLS prevents users from reading or modifying another user's data.
- The service role key is never exposed to client code.

---

## 35. Future Scope After MVP

After the personal MVP works, future versions may add:

- User accounts
- Backend database
- Cloud persistence
- Teacher accounts
- Classrooms
- Class codes
- Classroom leaderboards
- Teacher dashboard
- Student portfolio sharing
- Teacher exports
- Reflection prompts
- Badges
- Multiple leaderboards
- Risk-adjusted rankings
- CSV export
- More advanced analytics
- Dividend simulation
- Corporate action handling
- Configurable starting balances
- Configurable trading fees
- Quizzes
- Course progress tracking
- Certificate/completion flow
- Videos or interactive lessons

---

## 35. Final Build-Readiness Statement

This PRD is intended to serve as a complete product, engineering, and design handoff for the MVP.

The build should follow the locked decisions in Section 24 unless a future stakeholder explicitly changes the requirements.

The MVP is not considered complete until all required features, screens, calculations, Learning Center content, charts, risk warnings, API routes, localStorage behavior, and acceptance criteria listed in this document are implemented and tested.

