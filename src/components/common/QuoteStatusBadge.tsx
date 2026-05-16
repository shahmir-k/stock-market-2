import type { Freshness } from '@/types/market';

const STYLES: Record<Freshness, { label: string; className: string }> = {
  FRESH: { label: 'Fresh', className: 'bg-success/10 text-success' },
  RECENT: { label: 'Recent', className: 'bg-info/10 text-info' },
  STALE: { label: 'Stale', className: 'bg-warning/15 text-warning' },
  UNAVAILABLE: { label: 'Unavailable', className: 'bg-danger/10 text-danger' },
};

export function QuoteStatusBadge({ freshness }: { freshness?: Freshness }) {
  const meta = STYLES[freshness ?? 'UNAVAILABLE'];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
