// In-app educational projection types — UI views over the learning content
// model. Pure data types only; runtime label maps live in src/lib/learning/.

import type { LearningCategory, LearningTerm } from './learning';

// Display metadata for a learning category — used by category tabs and
// search filters on /learn.
export type LearningCategoryMeta = {
  category: LearningCategory;
  label: string;
  description?: string;
};

// Compact projection of a term, used by cards and tooltip previews where the
// full body is not needed.
export type TermSummary = Pick<
  LearningTerm,
  'slug' | 'title' | 'shortDefinition' | 'category'
>;
