import Link from 'next/link';

import { LEARNING_CATEGORY_LABELS } from '@/lib/learning';
import type { LearningTerm } from '@/types/learning';

export function LearningTermCard({ term }: { term: LearningTerm }) {
  return (
    <Link
      href={`/learn/${term.slug}`}
      className="block rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-accent hover:shadow-md"
    >
      <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {LEARNING_CATEGORY_LABELS[term.category]}
      </div>
      <h3 className="mt-1 text-base font-semibold text-text-primary">
        {term.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-text-secondary">
        {term.shortDefinition}
      </p>
      <span className="mt-3 inline-block text-xs font-medium text-accent">
        Read more →
      </span>
    </Link>
  );
}
