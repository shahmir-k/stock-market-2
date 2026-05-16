// Learning Center content data model per PRD §15.9.
// Term content itself ships in src/content/learningTerms.ts (T-009).

export type LearningCategory =
  | 'MARKET_BASICS'
  | 'PORTFOLIO_BASICS'
  | 'GAINS_LOSSES'
  | 'RISK_DIVERSIFICATION'
  | 'LONG_TERM_INVESTING'
  | 'SIMULATOR_CONCEPTS';

export type LearningTerm = {
  slug: string;
  title: string;
  category: LearningCategory;
  shortDefinition: string;
  simpleDefinition: string;
  inSimulator: string;
  whyItMatters: string;
  example: string;
  relatedSlugs: string[];
};
