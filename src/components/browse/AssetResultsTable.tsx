'use client';

import Link from 'next/link';

import { Badge } from '@/components/common/Badge';

import type { AssetSearchResult, QuoteResponseData } from '@/types/market';

export type ResultRow = AssetSearchResult & {
  quote?: QuoteResponseData | null;
};

export function AssetResultsTable({ rows }: { rows: ResultRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b rule text-text-muted">
            {[
              ['Symbol', ''],
              ['Name', ''],
              ['Type', ''],
              ['Exchange', ''],
              ['Currency', ''],
              ['Price', 'right'],
              ['Day', 'right'],
              ['', 'right'],
            ].map(([h, align], i) => (
              <th
                key={`${h}-${i}`}
                className={`py-3 pr-4 text-[10px] font-medium uppercase tracking-[0.12em] ${
                  align === 'right' ? 'text-right' : ''
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const change = row.quote?.changePercent ?? 0;
            const positive = change >= 0;
            return (
              <tr
                key={`${row.symbol}|${row.exchange}|${row.currency}`}
                className="border-b rule transition-colors duration-[var(--dur-fast)] hover:bg-surface-muted/40"
              >
                <td className="py-4 pr-4">
                  <div className="font-medium text-ink">{row.symbol}</div>
                </td>
                <td className="py-4 pr-4 text-text-secondary">
                  <span className="block max-w-[28ch] truncate" title={row.name}>
                    {row.name}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <Badge tone="neutral" variant="text">
                    {row.assetType}
                  </Badge>
                </td>
                <td className="py-4 pr-4 text-text-secondary text-xs">
                  {row.exchange}
                </td>
                <td className="py-4 pr-4 text-text-secondary text-xs">
                  {row.currency}
                </td>
                <td className="py-4 pr-4 text-right tabular text-ink">
                  {row.quote
                    ? `${row.quote.priceNative.toFixed(2)}`
                    : <span className="text-text-muted">—</span>}
                </td>
                <td
                  className={`py-4 pr-4 text-right tabular text-xs ${
                    row.quote
                      ? positive
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-danger)]'
                      : 'text-text-muted'
                  }`}
                >
                  {row.quote?.changePercent !== undefined
                    ? `${positive ? '+' : ''}${change.toFixed(2)}%`
                    : '—'}
                </td>
                <td className="py-4 text-right">
                  <Link
                    href={`/asset/${encodeURIComponent(row.symbol)}`}
                    className="text-sm text-[var(--color-accent)] underline-offset-4 hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
