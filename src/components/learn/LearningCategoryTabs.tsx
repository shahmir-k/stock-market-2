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
  return (
    <div className="flex flex-wrap gap-2">
      <TabButton
        active={value === 'ALL'}
        onClick={() => onChange('ALL')}
        label="All"
      />
      {LEARNING_CATEGORIES_META.map((c) => (
        <TabButton
          key={c.category}
          active={value === c.category}
          onClick={() => onChange(c.category)}
          label={c.label}
        />
      ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
        active
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-border text-text-secondary hover:bg-surface-muted'
      }`}
    >
      {label}
    </button>
  );
}
