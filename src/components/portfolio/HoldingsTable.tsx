'use client';

import Link from 'next/link';

import { CurrencyValue } from '@/components/common/CurrencyValue';
import { EmptyState } from '@/components/common/EmptyState';
import { PercentValue } from '@/components/common/PercentValue';
import { QuoteStatusBadge } from '@/components/common/QuoteStatusBadge';
import {
  selectHoldingsWithAnalytics,
  useSimulatorStore,
} from '@/store/simulatorStore';

export function HoldingsTable() {
  const rows = useSimulatorStore(selectHoldingsWithAnalytics);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No holdings yet"
        message="You do not own any stocks or ETFs yet. Browse assets to make your first virtual trade."
        action={
          <Link
            href="/browse"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Browse
          </Link>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Sector</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Avg Cost</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3 text-right">Value</th>
            <th className="px-4 py-3 text-right">G/L $</th>
            <th className="px-4 py-3 text-right">G/L %</th>
            <th className="px-4 py-3 text-right">Alloc</th>
            <th className="px-4 py-3">Quote</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr
              key={h.symbol}
              className="border-t border-border hover:bg-surface-muted/40"
            >
              <td className="px-4 py-3 font-semibold">{h.symbol}</td>
              <td className="px-4 py-3 text-text-secondary">{h.assetName}</td>
              <td className="px-4 py-3 text-text-secondary">{h.assetType}</td>
              <td className="px-4 py-3 text-text-secondary">
                {h.sector ?? 'Unknown'}
              </td>
              <td className="px-4 py-3 text-right tabular">
                {h.quantity.toFixed(4).replace(/\.?0+$/, '')}
              </td>
              <td className="px-4 py-3 text-right tabular">
                <CurrencyValue value={h.averageCostCad} />
              </td>
              <td className="px-4 py-3 text-right tabular">
                <CurrencyValue value={h.currentPriceCad} />
              </td>
              <td className="px-4 py-3 text-right tabular font-medium">
                <CurrencyValue value={h.marketValueCad} />
              </td>
              <td
                className={`px-4 py-3 text-right tabular ${
                  h.unrealizedGainLossCad >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                <CurrencyValue value={h.unrealizedGainLossCad} showSign />
              </td>
              <td
                className={`px-4 py-3 text-right tabular ${
                  h.unrealizedGainLossPercent >= 0
                    ? 'text-success'
                    : 'text-danger'
                }`}
              >
                <PercentValue
                  value={h.unrealizedGainLossPercent}
                  showSign
                />
              </td>
              <td className="px-4 py-3 text-right tabular">
                <PercentValue value={h.allocationPercent} />
              </td>
              <td className="px-4 py-3">
                <QuoteStatusBadge freshness={h.quoteFreshness} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/asset/${encodeURIComponent(h.symbol)}`}
                  className="rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/20"
                >
                  Trade
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
