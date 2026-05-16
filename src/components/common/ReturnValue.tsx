// Composite display for a CAD return + percent. Picks success/danger color
// based on sign. Always pairs color with sign so PRD §17.3 "do not rely on
// color alone" holds.

import { CurrencyValue } from './CurrencyValue';
import { PercentValue } from './PercentValue';

export function ReturnValue({
  cad,
  percent,
  layout = 'inline',
  className = '',
}: {
  cad: number;
  percent: number;
  layout?: 'inline' | 'stacked';
  className?: string;
}) {
  const colorClass =
    cad > 0
      ? 'text-success'
      : cad < 0
        ? 'text-danger'
        : 'text-text-secondary';
  return (
    <span
      className={`${colorClass} ${
        layout === 'stacked' ? 'flex flex-col' : 'inline-flex items-baseline gap-2'
      } ${className}`}
    >
      <CurrencyValue value={cad} showSign />
      <span className="text-sm">
        (<PercentValue value={percent} showSign />)
      </span>
    </span>
  );
}
