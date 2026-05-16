'use client';

import type { AssetType } from '@/types/market';

export type AssetFilterValue = 'ALL' | AssetType;

export function AssetFilters({
  value,
  onChange,
}: {
  value: AssetFilterValue;
  onChange: (next: AssetFilterValue) => void;
}) {
  const opts: { label: string; value: AssetFilterValue }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Stocks', value: 'STOCK' },
    { label: 'ETFs', value: 'ETF' },
  ];
  return (
    <div className="flex items-baseline gap-5 text-sm">
      <span className="eyebrow">Filter</span>
      {opts.map((o) => {
        const isActive = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`transition-colors duration-[var(--dur-fast)] ${
              isActive
                ? 'font-medium text-ink underline underline-offset-4 decoration-[var(--color-accent)]'
                : 'text-text-secondary hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
