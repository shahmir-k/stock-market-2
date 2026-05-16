import Link from 'next/link';

import { LEARNING_CATEGORY_LABELS } from '@/lib/learning';
import type { LearningTerm } from '@/types/learning';

// Editorial directory listing — one row per term, no boxed card. The whole
// row is the click target; arrow appears on hover.
export function LearningTermCard({ term }: { term: LearningTerm }) {
  return (
    <Link
      href={`/learn/${term.slug}`}
      className="group block border-b rule py-5 transition-colors duration-[var(--dur-fast)] hover:bg-surface-muted/40"
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-6">
        <span className="eyebrow w-28 shrink-0">
          {LEARNING_CATEGORY_LABELS[term.category]}
        </span>
        <div>
          <h3 className="font-display text-xl text-ink">{term.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            {term.shortDefinition}
          </p>
        </div>
        <span className="text-[var(--color-accent)] opacity-0 transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100">
          →
        </span>
      </div>
    </Link>
  );
}
