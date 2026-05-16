'use client';

import Link from 'next/link';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { Eyebrow } from '@/components/common/Eyebrow';
import { PercentValue } from '@/components/common/PercentValue';
import type { Freshness } from '@/types/market';
import {
  selectHoldingsWithAnalytics,
  useSimulatorStore,
} from '@/store/simulatorStore';

const FRESHNESS_TONE: Record<Freshness, 'success' | 'info' | 'warning' | 'danger'> = {
  FRESH: 'success',
  RECENT: 'info',
  STALE: 'warning',
  UNAVAILABLE: 'danger',
};

const FRESHNESS_LABEL: Record<Freshness, string> = {
  FRESH: 'Fresh',
  RECENT: 'Recent',
  STALE: 'Stale',
  UNAVAILABLE: 'No quote',
};

export function HoldingsTable() {
  const rows = useSimulatorStore(selectHoldingsWithAnalytics);

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <Eyebrow>Empty</Eyebrow>
        <p className="font-display mt-2 text-2xl text-ink">No holdings yet.</p>
        <p className="mt-2 text-sm text-text-secondary">
          Browse stocks and ETFs to place your first virtual trade.
        </p>
        <div className="mt-5">
          <Link href="/browse">
            <Button variant="primary" size="md">
              Browse markets →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b rule text-text-muted">
            {[
              'Symbol',
              'Name',
              'Sector',
              'Qty',
              'Avg cost',
              'Price',
              'Value',
              'G/L',
              '%',
              'Alloc',
              'Quote',
              '',
            ].map((h, i) => (
              <th
                key={h || i}
                className={`py-3 pr-4 text-[10px] font-medium uppercase tracking-[0.12em] ${
                  i >= 3 && i <= 9 ? 'text-right' : ''
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr
              key={h.symbol}
              className="border-b rule transition-colors duration-[var(--dur-fast)] hover:bg-surface-muted/40"
            >
              <td className="py-4 pr-4">
                <div className="font-medium text-ink">{h.symbol}</div>
              </td>
              <td className="py-4 pr-4 text-text-secondary">
                <span className="block max-w-[14ch] truncate" title={h.assetName}>
                  {h.assetName}
                </span>
              </td>
              <td className="py-4 pr-4 text-text-secondary text-xs">
                {h.sector ?? 'Unknown'}
              </td>
              <td className="py-4 pr-4 text-right tabular">
                {h.quantity.toFixed(4).replace(/\.?0+$/, '')}
              </td>
              <td className="py-4 pr-4 text-right tabular text-text-secondary">
                <CurrencyValue value={h.averageCostCad} />
              </td>
              <td className="py-4 pr-4 text-right tabular">
                <CurrencyValue value={h.currentPriceCad} />
              </td>
              <td className="py-4 pr-4 text-right tabular text-ink">
                <CurrencyValue value={h.marketValueCad} />
              </td>
              <td
                className={`py-4 pr-4 text-right tabular ${
                  h.unrealizedGainLossCad >= 0
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-danger)]'
                }`}
              >
                <CurrencyValue value={h.unrealizedGainLossCad} showSign />
              </td>
              <td
                className={`py-4 pr-4 text-right tabular ${
                  h.unrealizedGainLossPercent >= 0
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-danger)]'
                }`}
              >
                <PercentValue value={h.unrealizedGainLossPercent} showSign />
              </td>
              <td className="py-4 pr-4 text-right tabular text-text-secondary">
                <PercentValue value={h.allocationPercent} />
              </td>
              <td className="py-4 pr-4">
                {h.quoteFreshness ? (
                  <Badge tone={FRESHNESS_TONE[h.quoteFreshness]} variant="text">
                    {FRESHNESS_LABEL[h.quoteFreshness]}
                  </Badge>
                ) : (
                  <span className="text-xs text-text-muted">—</span>
                )}
              </td>
              <td className="py-4 text-right">
                <Link
                  href={`/asset/${encodeURIComponent(h.symbol)}`}
                  className="text-sm text-[var(--color-accent)] underline-offset-4 hover:underline"
                >
                  Trade →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
