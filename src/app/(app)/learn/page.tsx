'use client';

import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Learn Investing Terms</h1>

      <LearningSearch value={query} onChange={setQuery} />
      <LearningCategoryTabs value={category} onChange={setCategory} />

      {terms.length === 0 ? (
        <EmptyState message="No learning terms match your search." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((t) => (
            <LearningTermCard key={t.slug} term={t} />
          ))}
        </div>
      )}
    </div>
  );
}
