'use client';

import { useEffect, useState } from 'react';

import { AssetHistoryChart } from '@/components/charts/AssetHistoryChart';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { ErrorState } from '@/components/common/ErrorState';
import { LearningLink } from '@/components/common/LearningLink';
import { LoadingState } from '@/components/common/LoadingState';
import { QuoteStatusBadge } from '@/components/common/QuoteStatusBadge';
import { TradeTicket } from '@/components/trading/TradeTicket';
import { LEARN } from '@/lib/learning';
import { useSimulatorStore } from '@/store/simulatorStore';
import type { QuoteResponseData } from '@/types/market';

import { QuoteChangeBadge } from '../browse/QuoteChangeBadge';

export function AssetDetailClient({ symbol }: { symbol: string }) {
  const getQuote = useSimulatorStore((s) => s.getQuote);
  const refreshFxRate = useSimulatorStore((s) => s.refreshFxRate);
  const fxRate = useSimulatorStore((s) => s.fxRateUsdCad);
  // Wait for hydration and re-fetch when the data mode flips, so a switch
  // from API → MOCK in /settings actually changes the displayed quote.
  const isHydrated = useSimulatorStore((s) => s.isHydrated);
  const marketDataMode = useSimulatorStore((s) => s.marketDataMode);

  const [quote, setQuote] = useState<QuoteResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const q = await getQuote(symbol);
        if (q.currency === 'USD') {
          await refreshFxRate('USD', 'CAD');
        }
        if (!cancelled) setQuote(q);
      } catch {
        if (!cancelled) setError('Quote unavailable for this asset.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, getQuote, refreshFxRate, isHydrated, marketDataMode]);

  if (loading) return <LoadingState message="Loading quote…" />;
  if (error || !quote) {
    return (
      <ErrorState
        title="Quote unavailable"
        message={error ?? 'No quote returned for this asset.'}
      />
    );
  }

  const effectiveFx = quote.currency === 'CAD' ? 1 : fxRate ?? null;
  const cadPrice = effectiveFx ? quote.priceNative * effectiveFx : null;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold">{quote.symbol}</h1>
          <span className="text-text-secondary">{quote.name}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          <span>{quote.assetType}</span>
          <span>·</span>
          <span>{quote.exchange}</span>
          <span>·</span>
          <span>{quote.currency}</span>
          <QuoteStatusBadge freshness={quote.freshness} />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="text-xs uppercase tracking-wide text-text-muted">
            Price
          </div>
          <div className="mt-1 text-3xl font-bold tabular">
            {quote.priceNative.toFixed(2)} {quote.currency}
          </div>
          {cadPrice !== null && quote.currency !== 'CAD' ? (
            <div className="mt-1 text-sm text-text-secondary">
              ≈ <CurrencyValue value={cadPrice} />
            </div>
          ) : null}
          <div className="mt-2">
            <QuoteChangeBadge percent={quote.changePercent} />
            {quote.changeNative !== undefined ? (
              <span className="ml-2 text-sm text-text-secondary">
                ({quote.changeNative > 0 ? '+' : ''}
                {quote.changeNative.toFixed(2)} {quote.currency})
              </span>
            ) : null}
          </div>
          <div className="mt-3 text-xs text-text-secondary">
            Last updated {new Date(quote.quoteTimestamp).toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-semibold">Trade</h2>
          <TradeTicket symbol={symbol} quote={quote} fxRate={effectiveFx} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-base font-semibold">Price History (30 days)</h2>
        <AssetHistoryChart symbol={symbol} />
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
        Learn:{' '}
        <LearningLink slug={LEARN.STOCK} /> · <LearningLink slug={LEARN.ETF} />{' '}
        · <LearningLink slug={LEARN.MARKET_PRICE} /> ·{' '}
        <LearningLink slug={LEARN.FRACTIONAL_SHARES} />
      </section>
    </div>
  );
}
