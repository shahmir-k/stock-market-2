// Learning Center MVP content — 30 beginner investing terms per PRD §24.9
// + §28. Each term follows the same structure (PRD §9.7 Term Detail Format):
// title, simpleDefinition, inSimulator, whyItMatters, example, relatedSlugs.
//
// `relatedSlugs` reference only slugs defined in this file. PRD §28 referenced
// a few non-required terms (Currency Conversion, Quote, Buy, Sell, Holding);
// those are dropped here so no link goes 404.

import type { LearningTerm } from '@/types/learning';

export const LEARNING_TERMS: LearningTerm[] = [
  // -------------------------------------------------------------------------
  // Market Basics (PRD §28.1)
  // -------------------------------------------------------------------------
  {
    slug: 'stock',
    title: 'Stock',
    category: 'MARKET_BASICS',
    shortDefinition: 'A stock is a small piece of ownership in a company.',
    simpleDefinition: 'A stock is a small piece of ownership in a company.',
    inSimulator:
      'When you buy a stock, your virtual portfolio owns virtual shares of that company.',
    whyItMatters:
      'The value of your holding changes when the stock price changes.',
    example:
      'You buy 2 shares at $100 each. Later the price rises to $110. Your shares are now worth $220, giving you an unrealized gain of $20.',
    relatedSlugs: ['share', 'market-price', 'portfolio', 'unrealized-gain-loss'],
  },
  {
    slug: 'etf',
    title: 'ETF',
    category: 'MARKET_BASICS',
    shortDefinition:
      'An ETF is a fund that trades like a stock and usually holds a basket of investments.',
    simpleDefinition:
      'An ETF is a fund that trades like a stock and usually holds a basket of investments.',
    inSimulator:
      'Buying an ETF lets your portfolio get exposure to many investments through one ticker.',
    whyItMatters:
      'ETFs can make diversification easier than buying many individual stocks yourself.',
    example:
      'Instead of buying 20 companies one by one, you buy one broad-market ETF that holds many companies.',
    relatedSlugs: ['diversification', 'portfolio', 'stock-exchange', 'allocation'],
  },
  {
    slug: 'share',
    title: 'Share',
    category: 'MARKET_BASICS',
    shortDefinition: 'A share is one unit of ownership in a stock or ETF.',
    simpleDefinition: 'A share is one unit of ownership in a stock or ETF.',
    inSimulator:
      'Your quantity shows how many shares, including fractional shares, you virtually own.',
    whyItMatters:
      'The number of shares multiplied by the current price determines the holding value.',
    example:
      'If you own 1.5 shares and each share is worth $100 CAD, your holding is worth $150 CAD.',
    relatedSlugs: ['stock', 'etf', 'fractional-shares', 'market-price'],
  },
  {
    slug: 'ticker-symbol',
    title: 'Ticker Symbol',
    category: 'MARKET_BASICS',
    shortDefinition:
      'A ticker symbol is a short code used to identify a stock or ETF.',
    simpleDefinition:
      'A ticker symbol is a short code used to identify a stock or ETF.',
    inSimulator:
      'You search for assets using ticker symbols like AAPL, MSFT, or VFV.TO.',
    whyItMatters:
      'Ticker symbols help avoid confusion between companies or funds with similar names.',
    example: 'Apple Inc. uses the ticker AAPL on NASDAQ.',
    relatedSlugs: ['stock-exchange', 'stock', 'etf'],
  },
  {
    slug: 'stock-exchange',
    title: 'Stock Exchange',
    category: 'MARKET_BASICS',
    shortDefinition:
      'A stock exchange is a marketplace where stocks and ETFs are bought and sold.',
    simpleDefinition:
      'A stock exchange is a marketplace where stocks and ETFs are bought and sold.',
    inSimulator:
      'Supported exchanges include NASDAQ, NYSE, NYSE ARCA, and TSX.',
    whyItMatters:
      'The exchange helps determine where the asset trades, what currency it uses, and whether the simulator supports it.',
    example: 'AAPL trades on NASDAQ. Many Canadian stocks trade on TSX.',
    relatedSlugs: ['ticker-symbol', 'market-price'],
  },
  {
    slug: 'market-price',
    title: 'Market Price',
    category: 'MARKET_BASICS',
    shortDefinition:
      'Market price is the latest available price of a stock or ETF.',
    simpleDefinition:
      'Market price is the latest available price of a stock or ETF.',
    inSimulator:
      'Trades execute using the latest available quote shown by the app.',
    whyItMatters:
      'The price determines how much it costs to buy and how much you receive when selling.',
    example:
      'If the market price is $50 and you buy 2 shares, the estimated cost is $100 before currency conversion.',
    relatedSlugs: ['price-change', 'gain-loss'],
  },
  {
    slug: 'price-change',
    title: 'Price Change',
    category: 'MARKET_BASICS',
    shortDefinition:
      "Price change shows how much an asset's price has moved over a period of time.",
    simpleDefinition:
      "Price change shows how much an asset's price has moved over a period of time.",
    inSimulator:
      'The Browse and Asset Detail screens may show daily change as dollars and/or percent.',
    whyItMatters:
      'Price changes affect your portfolio value and gains/losses.',
    example:
      'If a stock rises from $100 to $105, the price change is +$5 or +5%.',
    relatedSlugs: ['market-price', 'return-percentage', 'gain-loss'],
  },

  // -------------------------------------------------------------------------
  // Portfolio Basics (PRD §28.2)
  // -------------------------------------------------------------------------
  {
    slug: 'portfolio',
    title: 'Portfolio',
    category: 'PORTFOLIO_BASICS',
    shortDefinition:
      'A portfolio is the full collection of your cash and investments.',
    simpleDefinition:
      'A portfolio is the full collection of your cash and investments.',
    inSimulator:
      'Your portfolio includes virtual cash, stocks, ETFs, transaction history, and performance.',
    whyItMatters:
      'Your total portfolio value shows the combined result of all your decisions.',
    example:
      'If you have $1,000 cash and $4,200 in holdings, your portfolio value is $5,200.',
    relatedSlugs: ['cash-balance', 'invested-value', 'portfolio-value', 'allocation'],
  },
  {
    slug: 'cash-balance',
    title: 'Cash Balance',
    category: 'PORTFOLIO_BASICS',
    shortDefinition:
      'Cash balance is the virtual money you have not invested yet.',
    simpleDefinition:
      'Cash balance is the virtual money you have not invested yet.',
    inSimulator: 'Buying reduces cash. Selling increases cash.',
    whyItMatters:
      'Cash lets you make future trades, but cash alone does not rise or fall with stock prices.',
    example:
      'You start with $5,000 CAD. If you buy $1,200 of stocks, your cash becomes $3,800.',
    relatedSlugs: ['portfolio', 'invested-value'],
  },
  {
    slug: 'invested-value',
    title: 'Invested Value',
    category: 'PORTFOLIO_BASICS',
    shortDefinition:
      'Invested value is the current market value of the assets you own.',
    simpleDefinition:
      'Invested value is the current market value of the assets you own.',
    inSimulator: 'It is calculated from your holdings, not your cash.',
    whyItMatters:
      'Invested value shows how much of your portfolio is exposed to market movement.',
    example:
      'If your stocks and ETFs are currently worth $3,400, your invested value is $3,400.',
    relatedSlugs: ['portfolio-value', 'cash-balance', 'allocation'],
  },
  {
    slug: 'portfolio-value',
    title: 'Portfolio Value',
    category: 'PORTFOLIO_BASICS',
    shortDefinition:
      'Portfolio value is your cash plus the current value of your holdings.',
    simpleDefinition:
      'Portfolio value is your cash plus the current value of your holdings.',
    inSimulator:
      'This is the main number used to show how your virtual account is doing.',
    whyItMatters:
      'It combines both uninvested cash and invested assets into one total.',
    example: '$900 cash + $4,300 holdings = $5,200 portfolio value.',
    relatedSlugs: ['cash-balance', 'invested-value', 'total-return'],
  },
  {
    slug: 'allocation',
    title: 'Allocation',
    category: 'PORTFOLIO_BASICS',
    shortDefinition:
      'Allocation shows how your portfolio is divided across assets, sectors, or cash.',
    simpleDefinition:
      'Allocation shows how your portfolio is divided across assets, sectors, or cash.',
    inSimulator:
      'The sector pie chart and holdings table show allocation percentages.',
    whyItMatters:
      'Allocation helps you see whether your portfolio is diversified or concentrated.',
    example:
      'If $3,000 of a $5,000 portfolio is in one stock, that stock has a 60% allocation.',
    relatedSlugs: ['diversification', 'concentration-risk', 'sector-risk'],
  },
  {
    slug: 'average-cost',
    title: 'Average Cost',
    category: 'PORTFOLIO_BASICS',
    shortDefinition:
      'Average cost is the average price you paid per share for a holding.',
    simpleDefinition:
      'Average cost is the average price you paid per share for a holding.',
    inSimulator:
      'When you buy more of the same asset, the app recalculates average cost.',
    whyItMatters:
      'Average cost is used to estimate your gain or loss when the price changes or when you sell.',
    example:
      'You buy 1 share at $100 and another at $120. Your average cost is $110.',
    relatedSlugs: ['cost-basis', 'realized-gain-loss', 'unrealized-gain-loss'],
  },
  {
    slug: 'cost-basis',
    title: 'Cost Basis',
    category: 'PORTFOLIO_BASICS',
    shortDefinition: 'Cost basis is the total amount you paid for an investment.',
    simpleDefinition: 'Cost basis is the total amount you paid for an investment.',
    inSimulator:
      'Cost basis is calculated using quantity multiplied by average cost.',
    whyItMatters:
      'Gains and losses are measured by comparing current or sale value against cost basis.',
    example:
      'If you own 3 shares with an average cost of $50, your cost basis is $150.',
    relatedSlugs: ['average-cost', 'gain-loss', 'realized-gain-loss'],
  },

  // -------------------------------------------------------------------------
  // Gains and Losses (PRD §28.3)
  // -------------------------------------------------------------------------
  {
    slug: 'gain-loss',
    title: 'Gain/Loss',
    category: 'GAINS_LOSSES',
    shortDefinition:
      'A gain means an investment is worth more than you paid. A loss means it is worth less.',
    simpleDefinition:
      'A gain means an investment is worth more than you paid. A loss means it is worth less.',
    inSimulator:
      'The portfolio page shows gains and losses for each holding and for the whole portfolio.',
    whyItMatters:
      'Gain/loss helps you understand whether your investing decisions increased or decreased value.',
    example: 'You buy at $100 and the value becomes $115. Your gain is $15.',
    relatedSlugs: ['realized-gain-loss', 'unrealized-gain-loss', 'total-return'],
  },
  {
    slug: 'total-return',
    title: 'Total Return',
    category: 'GAINS_LOSSES',
    shortDefinition:
      'Total return shows how much your whole portfolio has gained or lost compared to the starting balance.',
    simpleDefinition:
      'Total return shows how much your whole portfolio has gained or lost compared to the starting balance.',
    inSimulator:
      'Total return compares your current portfolio value to the starting $5,000 CAD.',
    whyItMatters: 'It gives one overall measure of portfolio performance.',
    example:
      'If your portfolio is worth $5,300, your total return is +$300 or +6%.',
    relatedSlugs: ['portfolio-value', 'return-percentage', 'gain-loss'],
  },
  {
    slug: 'realized-gain-loss',
    title: 'Realized Gain/Loss',
    category: 'GAINS_LOSSES',
    shortDefinition:
      'A realized gain or loss happens when you sell an investment.',
    simpleDefinition:
      'A realized gain or loss happens when you sell an investment.',
    inSimulator:
      'Selling locks in the difference between your sale price and your average cost.',
    whyItMatters:
      'It separates gains/losses you have locked in from changes on investments you still own.',
    example:
      'You bought at $100 and sold at $120. Your realized gain is $20.',
    relatedSlugs: ['unrealized-gain-loss', 'average-cost', 'cost-basis'],
  },
  {
    slug: 'unrealized-gain-loss',
    title: 'Unrealized Gain/Loss',
    category: 'GAINS_LOSSES',
    shortDefinition:
      'An unrealized gain or loss is the gain or loss on something you still own.',
    simpleDefinition:
      'An unrealized gain or loss is the gain or loss on something you still own.',
    inSimulator:
      'The portfolio page shows unrealized gain/loss for current holdings.',
    whyItMatters:
      'It can change as prices move because you have not sold yet.',
    example:
      'You bought at $100 and the current price is $110. You have a $10 unrealized gain until you sell.',
    relatedSlugs: ['realized-gain-loss', 'market-price'],
  },
  {
    slug: 'return-percentage',
    title: 'Return Percentage',
    category: 'GAINS_LOSSES',
    shortDefinition:
      'Return percentage shows gain or loss compared to the amount invested or starting balance.',
    simpleDefinition:
      'Return percentage shows gain or loss compared to the amount invested or starting balance.',
    inSimulator:
      'It helps compare performance across holdings or the whole portfolio.',
    whyItMatters:
      'Percent return is easier to compare than dollar return when investments are different sizes.',
    example:
      'A $10 gain on $100 is a 10% return. A $10 gain on $1,000 is a 1% return.',
    relatedSlugs: ['total-return', 'gain-loss', 'portfolio-value'],
  },

  // -------------------------------------------------------------------------
  // Risk and Diversification (PRD §28.4)
  // -------------------------------------------------------------------------
  {
    slug: 'diversification',
    title: 'Diversification',
    category: 'RISK_DIVERSIFICATION',
    shortDefinition:
      'Diversification means spreading investments across different assets or sectors.',
    simpleDefinition:
      'Diversification means spreading investments across different assets or sectors.',
    inSimulator:
      'The diversification score and sector chart show how spread out your portfolio is.',
    whyItMatters:
      'Diversification can reduce the impact of one company or sector performing badly.',
    example:
      'Owning five companies in different sectors is usually more diversified than putting everything into one stock.',
    relatedSlugs: ['concentration-risk', 'sector-risk', 'allocation'],
  },
  {
    slug: 'concentration-risk',
    title: 'Concentration Risk',
    category: 'RISK_DIVERSIFICATION',
    shortDefinition:
      'Concentration risk happens when too much of your portfolio depends on one investment.',
    simpleDefinition:
      'Concentration risk happens when too much of your portfolio depends on one investment.',
    inSimulator:
      'The app warns you if one holding becomes a large percentage of your portfolio.',
    whyItMatters:
      'If that one investment drops, your whole portfolio can be hurt badly.',
    example:
      'If 75% of your portfolio is in one stock, one bad day for that stock can strongly affect your results.',
    relatedSlugs: ['diversification', 'allocation', 'going-all-in'],
  },
  {
    slug: 'sector-risk',
    title: 'Sector Risk',
    category: 'RISK_DIVERSIFICATION',
    shortDefinition:
      'Sector risk happens when too much of your portfolio is invested in one industry or sector.',
    simpleDefinition:
      'Sector risk happens when too much of your portfolio is invested in one industry or sector.',
    inSimulator:
      'The sector pie chart shows how much of your portfolio is in each sector.',
    whyItMatters:
      'Companies in the same sector can fall together when that industry has problems.',
    example:
      'If most of your portfolio is in technology stocks, a technology downturn may affect many holdings at once.',
    relatedSlugs: ['diversification', 'allocation', 'concentration-risk'],
  },
  {
    slug: 'volatility',
    title: 'Volatility',
    category: 'RISK_DIVERSIFICATION',
    shortDefinition:
      "Volatility means how much an investment's price moves up and down.",
    simpleDefinition:
      "Volatility means how much an investment's price moves up and down.",
    inSimulator:
      'Assets with large price swings may change your portfolio value quickly.',
    whyItMatters:
      'Higher volatility can create larger gains, but also larger losses.',
    example:
      'A stock that moves 8% in a day is more volatile than one that usually moves 1%.',
    relatedSlugs: ['risk-vs-reward', 'price-change', 'gain-loss'],
  },
  {
    slug: 'risk-vs-reward',
    title: 'Risk vs. Reward',
    category: 'RISK_DIVERSIFICATION',
    shortDefinition:
      'Risk vs. reward means investments with higher possible reward often come with higher possible downside.',
    simpleDefinition:
      'Risk vs. reward means investments with higher possible reward often come with higher possible downside.',
    inSimulator:
      'Risk warnings help you see when your choices may increase downside risk.',
    whyItMatters:
      'A high return is not the only thing that matters. The amount of risk taken matters too.',
    example:
      'Putting everything into one fast-moving stock could lead to a big gain or a big loss.',
    relatedSlugs: ['volatility', 'concentration-risk', 'diversification'],
  },
  {
    slug: 'going-all-in',
    title: 'Going All-In',
    category: 'RISK_DIVERSIFICATION',
    shortDefinition:
      'Going all-in means putting almost all your cash or portfolio into one investment or idea.',
    simpleDefinition:
      'Going all-in means putting almost all your cash or portfolio into one investment or idea.',
    inSimulator:
      'The app warns you if a trade leaves almost no cash or creates extreme concentration.',
    whyItMatters:
      'Going all-in can make your portfolio very sensitive to one outcome.',
    example:
      'If you use all $5,000 to buy one stock, your whole result depends on that stock.',
    relatedSlugs: ['concentration-risk', 'cash-balance', 'diversification'],
  },

  // -------------------------------------------------------------------------
  // Long-Term Investing and Simulator Concepts (PRD §28.5)
  // -------------------------------------------------------------------------
  {
    slug: 'compound-growth',
    title: 'Compound Growth',
    category: 'LONG_TERM_INVESTING',
    shortDefinition:
      'Compound growth happens when gains begin to generate their own gains over time.',
    simpleDefinition:
      'Compound growth happens when gains begin to generate their own gains over time.',
    inSimulator:
      'The compound growth tool shows how contributions plus growth can increase over many years.',
    whyItMatters:
      'Time can make a large difference because growth can build on previous growth.',
    example:
      "If money grows by 7% in one year, the next year can grow on the original money plus the first year's growth.",
    relatedSlugs: ['contribution', 'annual-return', 'time-horizon'],
  },
  {
    slug: 'contribution',
    title: 'Contribution',
    category: 'LONG_TERM_INVESTING',
    shortDefinition:
      'A contribution is money added to an investment account over time.',
    simpleDefinition:
      'A contribution is money added to an investment account over time.',
    inSimulator:
      'The compound growth tool lets you enter a monthly contribution.',
    whyItMatters:
      'Regular contributions can become a major part of long-term investing results.',
    example:
      'Contributing $200 per month for 10 years adds $24,000 before investment growth.',
    relatedSlugs: ['compound-growth', 'time-horizon', 'annual-return'],
  },
  {
    slug: 'annual-return',
    title: 'Annual Return',
    category: 'LONG_TERM_INVESTING',
    shortDefinition:
      'Annual return is the percentage an investment grows or shrinks over one year.',
    simpleDefinition:
      'Annual return is the percentage an investment grows or shrinks over one year.',
    inSimulator:
      'The compound tool uses annual return as an estimate, not a guarantee.',
    whyItMatters:
      'Small changes in annual return can create large differences over long periods.',
    example:
      'A 5% annual return and an 8% annual return can lead to very different results after 30 years.',
    relatedSlugs: ['compound-growth', 'return-percentage', 'time-horizon'],
  },
  {
    slug: 'time-horizon',
    title: 'Time Horizon',
    category: 'LONG_TERM_INVESTING',
    shortDefinition:
      'Time horizon is how long money stays invested before it is needed.',
    simpleDefinition:
      'Time horizon is how long money stays invested before it is needed.',
    inSimulator:
      'The compound tool lets you choose the number of years invested.',
    whyItMatters:
      'A longer time horizon gives compounding more time to work, but returns are never guaranteed.',
    example:
      'Investing for 40 years gives growth much more time than investing for 5 years.',
    relatedSlugs: ['compound-growth', 'contribution', 'annual-return'],
  },
  {
    slug: 'fractional-shares',
    title: 'Fractional Shares',
    category: 'SIMULATOR_CONCEPTS',
    shortDefinition: 'Fractional shares let you buy less than one full share.',
    simpleDefinition: 'Fractional shares let you buy less than one full share.',
    inSimulator: 'You can buy quantities like 0.5 or 1.25 shares.',
    whyItMatters:
      'Fractional shares make it easier to invest small amounts and diversify.',
    example:
      'If one share costs $400, buying 0.25 shares costs about $100 before currency conversion.',
    relatedSlugs: ['share', 'stock', 'etf', 'diversification'],
  },
];
