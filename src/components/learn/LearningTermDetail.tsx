import Link from 'next/link';

import { LEARNING_CATEGORY_LABELS, getRelatedTerms } from '@/lib/learning';
import type { LearningTerm } from '@/types/learning';

export function LearningTermDetail({ term }: { term: LearningTerm }) {
  const related = getRelatedTerms(term);
  return (
    <article className="space-y-6">
      <header>
        <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {LEARNING_CATEGORY_LABELS[term.category]}
        </div>
        <h1 className="mt-1 text-3xl font-bold text-text-primary">
          {term.title}
        </h1>
      </header>

      <Section title="Simple definition">{term.simpleDefinition}</Section>
      <Section title="In the simulator">{term.inSimulator}</Section>
      <Section title="Why it matters">{term.whyItMatters}</Section>
      <Section title="Example">{term.example}</Section>

      {related.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Related Terms
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/learn/${r.slug}`}
                className="rounded-full bg-surface-muted px-3 py-1 text-sm text-text-primary hover:bg-accent/10 hover:text-accent"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </h2>
      <p className="mt-2 text-base leading-relaxed text-text-primary">
        {children}
      </p>
    </section>
  );
}
