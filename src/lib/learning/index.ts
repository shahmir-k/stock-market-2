// Learning Center lookup helpers + slug constants.
//
// Components and content code should import slugs through `LEARN.*` rather
// than hard-coding string literals so that:
//   - Renames are caught at compile time
//   - Refactor tools (find usages, rename symbol) work
//   - A central place documents the canonical slug list

import { LEARNING_TERMS } from '@/content/learningTerms';
import type { LearningCategoryMeta, TermSummary } from '@/types/education';
import type { LearningCategory, LearningTerm } from '@/types/learning';

// ---------------------------------------------------------------------------
// Slug constants — UI labels → canonical slug, exported for compile-time
// safe references in `<LearningLink slug={LEARN.AVERAGE_COST} />`.
// ---------------------------------------------------------------------------
export const LEARN = {
  // Market Basics
  STOCK: 'stock',
  ETF: 'etf',
  SHARE: 'share',
  TICKER_SYMBOL: 'ticker-symbol',
  STOCK_EXCHANGE: 'stock-exchange',
  MARKET_PRICE: 'market-price',
  PRICE_CHANGE: 'price-change',
  // Portfolio Basics
  PORTFOLIO: 'portfolio',
  CASH_BALANCE: 'cash-balance',
  INVESTED_VALUE: 'invested-value',
  PORTFOLIO_VALUE: 'portfolio-value',
  ALLOCATION: 'allocation',
  AVERAGE_COST: 'average-cost',
  COST_BASIS: 'cost-basis',
  // Gains and Losses
  GAIN_LOSS: 'gain-loss',
  TOTAL_RETURN: 'total-return',
  REALIZED_GAIN_LOSS: 'realized-gain-loss',
  UNREALIZED_GAIN_LOSS: 'unrealized-gain-loss',
  RETURN_PERCENTAGE: 'return-percentage',
  // Risk and Diversification
  DIVERSIFICATION: 'diversification',
  CONCENTRATION_RISK: 'concentration-risk',
  SECTOR_RISK: 'sector-risk',
  VOLATILITY: 'volatility',
  RISK_VS_REWARD: 'risk-vs-reward',
  GOING_ALL_IN: 'going-all-in',
  // Long-Term Investing
  COMPOUND_GROWTH: 'compound-growth',
  CONTRIBUTION: 'contribution',
  ANNUAL_RETURN: 'annual-return',
  TIME_HORIZON: 'time-horizon',
  // Simulator Concepts
  FRACTIONAL_SHARES: 'fractional-shares',
} as const;

export type LearnSlug = (typeof LEARN)[keyof typeof LEARN];

// ---------------------------------------------------------------------------
// Category metadata — used by LearningCategoryTabs and search filters.
// PRD §9.7 ordering: Market Basics → Portfolio → Gains/Losses → Risk →
// Long-Term → Simulator.
// ---------------------------------------------------------------------------
export const LEARNING_CATEGORY_LABELS: Record<LearningCategory, string> = {
  MARKET_BASICS: 'Market Basics',
  PORTFOLIO_BASICS: 'Portfolio Basics',
  GAINS_LOSSES: 'Gains and Losses',
  RISK_DIVERSIFICATION: 'Risk and Diversification',
  LONG_TERM_INVESTING: 'Long-Term Investing',
  SIMULATOR_CONCEPTS: 'Simulator Concepts',
};

export const LEARNING_CATEGORIES_META: LearningCategoryMeta[] = [
  { category: 'MARKET_BASICS',         label: 'Market Basics',         description: 'How stocks, ETFs, and exchanges work.' },
  { category: 'PORTFOLIO_BASICS',      label: 'Portfolio Basics',      description: 'Cash, holdings, and how a portfolio is measured.' },
  { category: 'GAINS_LOSSES',          label: 'Gains and Losses',      description: 'Realized vs unrealized, total return, percentages.' },
  { category: 'RISK_DIVERSIFICATION',  label: 'Risk and Diversification', description: 'Concentration, volatility, and spreading risk.' },
  { category: 'LONG_TERM_INVESTING',   label: 'Long-Term Investing',   description: 'Compounding, contributions, and time horizon.' },
  { category: 'SIMULATOR_CONCEPTS',    label: 'Simulator Concepts',    description: 'Concepts unique to this virtual simulator.' },
];

// ---------------------------------------------------------------------------
// Lookup + search helpers
// ---------------------------------------------------------------------------

const TERMS_BY_SLUG: Map<string, LearningTerm> = new Map(
  LEARNING_TERMS.map((t) => [t.slug, t]),
);

export function getTermBySlug(slug: string): LearningTerm | null {
  return TERMS_BY_SLUG.get(slug) ?? null;
}

export function getTermsByCategory(category: LearningCategory): LearningTerm[] {
  return LEARNING_TERMS.filter((t) => t.category === category);
}

export function searchTerms(query: string): LearningTerm[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return LEARNING_TERMS;
  return LEARNING_TERMS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.simpleDefinition.toLowerCase().includes(q) ||
      t.shortDefinition.toLowerCase().includes(q),
  );
}

export function toTermSummary(term: LearningTerm): TermSummary {
  return {
    slug: term.slug,
    title: term.title,
    shortDefinition: term.shortDefinition,
    category: term.category,
  };
}

export function getRelatedTerms(term: LearningTerm): LearningTerm[] {
  return term.relatedSlugs
    .map((slug) => TERMS_BY_SLUG.get(slug))
    .filter((t): t is LearningTerm => t !== undefined);
}
