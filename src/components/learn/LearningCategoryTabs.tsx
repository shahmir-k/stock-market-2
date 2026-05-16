'use client';

import { LEARNING_CATEGORIES_META } from '@/lib/learning';
import type { LearningCategory } from '@/types/learning';

export type CategoryTabValue = 'ALL' | LearningCategory;

export function LearningCategoryTabs({
  value,
  onChange,
}: {
  value: CategoryTabValue;
  onChange: (next: CategoryTabValue) => void;
}) {
  const items: { value: CategoryTabValue; label: string }[] = [
    { value: 'ALL', label: 'All' },
    ...LEARNING_CATEGORIES_META.map((c) => ({
      value: c.category as CategoryTabValue,
      label: c.label,
    })),
  ];
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
      <span className="eyebrow">Filter</span>
      {items.map((t) => {
        const isActive = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`transition-colors duration-[var(--dur-fast)] ${
              isActive
                ? 'font-medium text-ink underline underline-offset-4 decoration-[var(--color-accent)]'
                : 'text-text-secondary hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
