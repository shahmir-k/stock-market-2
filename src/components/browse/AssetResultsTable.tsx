'use client';

import Link from 'next/link';

import { AssetTypeBadge } from './AssetTypeBadge';
import { QuoteChangeBadge } from './QuoteChangeBadge';
import type { AssetSearchResult, QuoteResponseData } from '@/types/market';

export type ResultRow = AssetSearchResult & {
  quote?: QuoteResponseData | null;
};

export function AssetResultsTable({ rows }: { rows: ResultRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Exchange</th>
            <th className="px-4 py-3">Currency</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3 text-right">Change %</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.symbol}|${row.exchange}|${row.currency}`}
              className="border-t border-border hover:bg-surface-muted/40"
            >
              <td className="px-4 py-3 font-semibold">{row.symbol}</td>
              <td className="px-4 py-3 text-text-secondary">{row.name}</td>
              <td className="px-4 py-3">
                <AssetTypeBadge type={row.assetType} />
              </td>
              <td className="px-4 py-3 text-text-secondary">{row.exchange}</td>
              <td className="px-4 py-3 text-text-secondary">{row.currency}</td>
              <td className="px-4 py-3 text-right tabular">
                {row.quote
                  ? `${row.quote.priceNative.toFixed(2)} ${row.quote.currency}`
                  : '—'}
              </td>
              <td className="px-4 py-3 text-right tabular">
                <QuoteChangeBadge percent={row.quote?.changePercent} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/asset/${encodeURIComponent(row.symbol)}`}
                  className="rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/20"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
