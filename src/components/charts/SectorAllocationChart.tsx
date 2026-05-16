'use client';

import { sectorBreakdownCad } from '@/lib/calculations/portfolio';
import {
  selectCashCad,
  useSimulatorStore,
} from '@/store/simulatorStore';

import { CHART_PALETTE } from './chartSetup';

// Horizontal stacked bar — more legible than a pie for small N and stays
// on-brand with the editorial "hairline + warm palette" system. Hover
// shows each sector's CAD value and percentage.
export function SectorAllocationChart() {
  const holdings = useSimulatorStore((s) => s.portfolio.holdings);
  const cash = useSimulatorStore(selectCashCad);

  if (holdings.length === 0 && cash === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Allocation will appear after your first trade.
      </p>
    );
  }

  const breakdown = sectorBreakdownCad(holdings);
  const entries = [
    ...Object.entries(breakdown).map(([sector, value], i) => ({
      label: sector,
      value,
      color: CHART_PALETTE.categorical[i % CHART_PALETTE.categorical.length],
    })),
    {
      label: 'Cash',
      value: cash,
      color: CHART_PALETTE.textMuted,
    },
  ].filter((e) => e.value > 0);

  const total = entries.reduce((sum, e) => sum + e.value, 0);
  if (total <= 0) {
    return (
      <p className="text-sm text-text-secondary">
        Allocation will appear after your first trade.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stacked horizontal bar */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-sm"
        role="img"
        aria-label="Sector allocation"
      >
        {entries.map((e) => (
          <div
            key={e.label}
            style={{
              width: `${(e.value / total) * 100}%`,
              backgroundColor: e.color,
            }}
            title={`${e.label}: ${((e.value / total) * 100).toFixed(1)}%`}
            className="transition-opacity duration-[var(--dur-fast)] hover:opacity-80"
          />
        ))}
      </div>
      {/* Legend — hairline-separated rows */}
      <ul className="divide-y rule text-sm">
        {entries
          .slice()
          .sort((a, b) => b.value - a.value)
          .map((e) => {
            const pct = (e.value / total) * 100;
            return (
              <li
                key={e.label}
                className="grid grid-cols-[auto_1fr_auto_auto] items-baseline gap-x-4 py-2"
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{ backgroundColor: e.color }}
                />
                <span className="text-ink">{e.label}</span>
                <span className="tabular text-right text-text-secondary">
                  ${e.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="tabular w-12 text-right text-xs text-text-muted">
                  {pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
