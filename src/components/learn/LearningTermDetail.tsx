import Link from 'next/link';

import { Eyebrow } from '@/components/common/Eyebrow';
import { LEARNING_CATEGORY_LABELS, getRelatedTerms } from '@/lib/learning';
import type { LearningTerm } from '@/types/learning';

// Editorial article layout — max-width prose, generous leading, serif
// headings. Used standalone on /learn/[slug] and inside LearningDrawer.
export function LearningTermDetail({ term }: { term: LearningTerm }) {
  const related = getRelatedTerms(term);
  return (
    <article className="space-y-8">
      <header>
        <Eyebrow>{LEARNING_CATEGORY_LABELS[term.category]}</Eyebrow>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-ink md:text-5xl">
          {term.title}
        </h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-text-secondary">
          {term.shortDefinition}
        </p>
      </header>

      <Section title="Simple definition">{term.simpleDefinition}</Section>
      <Section title="In the simulator">{term.inSimulator}</Section>
      <Section title="Why it matters">{term.whyItMatters}</Section>
      <Section title="Example">{term.example}</Section>

      {related.length > 0 ? (
        <section className="border-t rule pt-6">
          <Eyebrow>Related terms</Eyebrow>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/learn/${r.slug}`}
                className="text-[var(--color-accent)] underline-offset-4 hover:underline"
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
    <section className="max-w-prose">
      <Eyebrow>{title}</Eyebrow>
      <p className="mt-3 text-base leading-relaxed text-ink">{children}</p>
    </section>
  );
}
