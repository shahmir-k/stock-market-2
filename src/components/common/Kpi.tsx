// Hero KPI block — replaces the boxed MetricCard for top-of-page values.
// Pattern: eyebrow label → giant display-serif value → optional one-line
// supporting metric. Used on Dashboard, Portfolio, asset detail, backtest.

import { Eyebrow } from './Eyebrow';

export function Kpi({
  label,
  value,
  sub,
  align = 'left',
  size = 'lg',
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  align?: 'left' | 'right';
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const valueSize =
    size === 'xl'
      ? 'text-5xl md:text-7xl'
      : size === 'lg'
        ? 'text-4xl md:text-6xl'
        : 'text-3xl md:text-4xl';
  return (
    <div className={`${align === 'right' ? 'text-right' : ''} ${className}`}>
      <Eyebrow>{label}</Eyebrow>
      <div className={`font-display mt-3 tabular text-ink ${valueSize}`}>
        {value}
      </div>
      {sub && <div className="mt-2 text-sm text-text-secondary">{sub}</div>}
    </div>
  );
}

// Compact KPI for stat strips (Cash · Invested · Realized · Unrealized).
// Used in a row of inline metrics under the hero — small label, mono number.
export function KpiInline({
  label,
  value,
  sub,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="eyebrow">{label}</div>
      <div className="mt-1.5 tabular text-lg text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-text-muted">{sub}</div>}
    </div>
  );
}
