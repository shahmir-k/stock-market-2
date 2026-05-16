'use client';

import { useState } from 'react';

import { AssetFilters, type AssetFilterValue } from '@/components/browse/AssetFilters';
import {
  AssetResultsTable,
  type ResultRow,
} from '@/components/browse/AssetResultsTable';
import { AssetSearchBar } from '@/components/browse/AssetSearchBar';
import { ErrorState } from '@/components/common/ErrorState';
import { Eyebrow } from '@/components/common/Eyebrow';
import { LoadingState } from '@/components/common/LoadingState';
import { useSimulatorStore } from '@/store/simulatorStore';
import type { AssetSearchResult } from '@/types/market';

export default function BrowsePage() {
  const searchAssets = useSimulatorStore((s) => s.searchAssets);
  const getQuote = useSimulatorStore((s) => s.getQuote);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AssetFilterValue>('ALL');
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const onSearch = async (q: string) => {
    setQuery(q);
    setHasSearched(true);
    setError(null);
    if (q.length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const found: AssetSearchResult[] = await searchAssets(q);
      const enriched: ResultRow[] = await Promise.all(
        found.map(async (r) => {
          try {
            const quote = await getQuote(r.symbol);
            return { ...r, quote };
          } catch {
            return { ...r, quote: null };
          }
        }),
      );
      setResults(enriched);
    } catch {
      setError('Market search is temporarily unavailable.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = (results ?? []).filter(
    (r) => filter === 'ALL' || r.assetType === filter,
  );

  return (
    <div className="space-y-12">
      <section className="fade-up">
        <Eyebrow>Discover</Eyebrow>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-ink md:text-6xl">
          Find a stock or
          <br />
          <em className="text-[var(--color-accent)]">ETF</em> to study.
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-text-secondary">
          Browse equities across NASDAQ, NYSE, NYSE Arca, and TSX. Crypto,
          options, and futures aren&apos;t supported &mdash; this simulator is
          for stocks and ETFs only.
        </p>
      </section>

      <section className="fade-up space-y-4" style={{ animationDelay: '60ms' }}>
        <AssetSearchBar initialQuery={query} onSearch={onSearch} />
        <AssetFilters value={filter} onChange={setFilter} />
      </section>

      <section className="fade-up" style={{ animationDelay: '120ms' }}>
        {loading ? (
          <LoadingState message="Searching market data…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : !hasSearched ? (
          <p className="text-sm text-text-secondary">
            Start typing above to see live market data from Twelve Data.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No supported stocks or ETFs match that query.
          </p>
        ) : (
          <>
            <p className="mb-4 text-xs text-text-muted">
              {filtered.length} result{filtered.length === 1 ? '' : 's'}
              {query ? <> for &ldquo;<span className="tabular">{query}</span>&rdquo;</> : null}
            </p>
            <AssetResultsTable rows={filtered} />
          </>
        )}
      </section>
    </div>
  );
}
