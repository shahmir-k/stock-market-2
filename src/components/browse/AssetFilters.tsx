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
    <div className="flex gap-2">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
            value === o.value
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border text-text-secondary hover:bg-surface-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
