import { PercentValue } from '@/components/common/PercentValue';

export function QuoteChangeBadge({ percent }: { percent?: number }) {
  if (percent === undefined || !Number.isFinite(percent)) {
    return <span className="text-text-muted">—</span>;
  }
  const colorClass =
    percent > 0
      ? 'text-success'
      : percent < 0
        ? 'text-danger'
        : 'text-text-secondary';
  return (
    <span className={colorClass}>
      <PercentValue value={percent} showSign />
    </span>
  );
}
