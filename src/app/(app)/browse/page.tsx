'use client';

import { useState } from 'react';

import { AssetFilters, type AssetFilterValue } from '@/components/browse/AssetFilters';
import {
  AssetResultsTable,
  type ResultRow,
} from '@/components/browse/AssetResultsTable';
import { AssetSearchBar } from '@/components/browse/AssetSearchBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
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
      // Best-effort fetch quotes (mock provider is sync-ish; for real API in
      // T-040 these will be cached + parallel).
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Browse Stocks &amp; ETFs</h1>

      <AssetSearchBar initialQuery={query} onSearch={onSearch} />
      <AssetFilters value={filter} onChange={setFilter} />

      {loading ? (
        <LoadingState message="Searching market data…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : !hasSearched ? (
        <EmptyState message="Search for a stock or ETF to begin." />
      ) : filtered.length === 0 ? (
        <EmptyState message="No matching supported stocks or ETFs found." />
      ) : (
        <AssetResultsTable rows={filtered} />
      )}
    </div>
  );
}
