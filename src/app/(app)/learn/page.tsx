'use client';

import { useMemo, useState } from 'react';

import { Eyebrow } from '@/components/common/Eyebrow';
import {
  LearningCategoryTabs,
  type CategoryTabValue,
} from '@/components/learn/LearningCategoryTabs';
import { LearningSearch } from '@/components/learn/LearningSearch';
import { LearningTermCard } from '@/components/learn/LearningTermCard';
import { searchTerms } from '@/lib/learning';

export default function LearnPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryTabValue>('ALL');

  const terms = useMemo(() => {
    let list = searchTerms(query);
    if (category !== 'ALL') {
      list = list.filter((t) => t.category === category);
    }
    return list;
  }, [query, category]);

  return (
    <div className="space-y-12">
      <section className="fade-up">
        <Eyebrow>Glossary</Eyebrow>
        <h1 className="font-display mt-3 text-5xl tracking-tight text-ink md:text-7xl">
          Thirty terms,
          <br />
          <em className="text-[var(--color-accent)]">six categories.</em>
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-text-secondary">
          The simulator teaches as you trade. This glossary collects the
          concepts you&apos;ll meet in the trade modal, on the portfolio page,
          and in the risk warnings &mdash; explained plainly, with worked
          examples.
        </p>
      </section>

      <section className="fade-up space-y-4" style={{ animationDelay: '60ms' }}>
        <LearningSearch value={query} onChange={setQuery} />
        <LearningCategoryTabs value={category} onChange={setCategory} />
      </section>

      <section className="fade-up" style={{ animationDelay: '120ms' }}>
        {terms.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No terms match that search.
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs text-text-muted">
              {terms.length} {terms.length === 1 ? 'term' : 'terms'}
            </p>
            <div className="border-t rule">
              {terms.map((t) => (
                <LearningTermCard key={t.slug} term={t} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
