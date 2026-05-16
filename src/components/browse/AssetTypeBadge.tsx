import type { AssetType } from '@/types/market';

export function AssetTypeBadge({ type }: { type: AssetType }) {
  return (
    <span className="inline-flex items-center rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-text-secondary">
      {type}
    </span>
  );
}
