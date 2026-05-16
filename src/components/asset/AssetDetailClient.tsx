'use client';

import { useEffect, useState } from 'react';

import { AssetHistoryChart } from '@/components/charts/AssetHistoryChart';
import { Badge } from '@/components/common/Badge';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { ErrorState } from '@/components/common/ErrorState';
import { Eyebrow } from '@/components/common/Eyebrow';
import { LearningLink } from '@/components/common/LearningLink';
import { LoadingState } from '@/components/common/LoadingState';
import { TradeTicket } from '@/components/trading/TradeTicket';
import { LEARN } from '@/lib/learning';
import { useSimulatorStore } from '@/store/simulatorStore';
import type { Freshness, QuoteResponseData } from '@/types/market';

const FRESHNESS_TONE: Record<Freshness, 'success' | 'info' | 'warning' | 'danger'> = {
  FRESH: 'success',
  RECENT: 'info',
  STALE: 'warning',
  UNAVAILABLE: 'danger',
};
const FRESHNESS_LABEL: Record<Freshness, string> = {
  FRESH: 'Live',
  RECENT: 'Recent',
  STALE: 'Stale',
  UNAVAILABLE: 'No quote',
};

export function AssetDetailClient({ symbol }: { symbol: string }) {
  const getQuote = useSimulatorStore((s) => s.getQuote);
  const refreshFxRate = useSimulatorStore((s) => s.refreshFxRate);
  const fxRate = useSimulatorStore((s) => s.fxRateUsdCad);
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
  const changePositive = (quote.changePercent ?? 0) >= 0;

  return (
    <div className="space-y-16">
      {/* Editorial Split: massive price left, trade ticket right (stacked on mobile) */}
      <section className="fade-up grid gap-12 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div>
          <Eyebrow>
            {quote.assetType} · {quote.exchange} · {quote.currency}
          </Eyebrow>
          <div className="mt-2 flex items-baseline gap-3">
            <h1 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
              {quote.symbol}
            </h1>
            <span className="text-base text-text-secondary md:text-lg">
              {quote.name}
            </span>
          </div>

          {/* Giant serif price */}
          <div className="mt-10 flex items-baseline gap-4">
            <div className="font-display tabular text-6xl text-ink md:text-8xl">
              {quote.priceNative.toFixed(2)}
            </div>
            <div className="text-text-muted">{quote.currency}</div>
          </div>

          {/* CAD conversion + change in supporting line */}
          <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm">
            {cadPrice !== null && quote.currency !== 'CAD' ? (
              <span className="text-text-secondary">
                ≈{' '}
                <span className="tabular text-ink">
                  <CurrencyValue value={cadPrice} />
                </span>{' '}
                CAD
              </span>
            ) : null}
            <span
              className={`tabular ${
                changePositive
                  ? 'text-[var(--color-success)]'
                  : 'text-[var(--color-danger)]'
              }`}
            >
              {changePositive ? '+' : ''}
              {(quote.changePercent ?? 0).toFixed(2)}%
              {quote.changeNative !== undefined ? (
                <span className="text-text-muted">
                  {' · '}
                  {changePositive ? '+' : ''}
                  {quote.changeNative.toFixed(2)} {quote.currency} today
                </span>
              ) : null}
            </span>
            <Badge tone={FRESHNESS_TONE[quote.freshness]} variant="text">
              {FRESHNESS_LABEL[quote.freshness]}
            </Badge>
          </div>

          <p className="mt-6 text-xs text-text-muted">
            As of {new Date(quote.quoteTimestamp).toLocaleString()}
          </p>
        </div>

        {/* Trade ticket — sticky on wide screens */}
        <aside className="md:sticky md:top-24 md:self-start">
          <Eyebrow>Trade</Eyebrow>
          <h2 className="font-display mt-2 text-2xl text-ink">
            Buy or sell {quote.symbol}
          </h2>
          <div className="mt-6">
            <TradeTicket symbol={symbol} quote={quote} fxRate={effectiveFx} />
          </div>
        </aside>
      </section>

      {/* Price history chart — full width, no boxed card */}
      <section className="fade-up" style={{ animationDelay: '120ms' }}>
        <header className="mb-6 border-b rule pb-3">
          <Eyebrow>30-day history</Eyebrow>
          <h2 className="font-display mt-2 text-2xl text-ink">Price chart</h2>
        </header>
        <AssetHistoryChart symbol={symbol} />
      </section>

      <section className="fade-up border-t rule pt-6 text-sm text-text-muted" style={{ animationDelay: '180ms' }}>
        Read:{' '}
        <LearningLink slug={LEARN.STOCK} /> ·{' '}
        <LearningLink slug={LEARN.ETF} /> ·{' '}
        <LearningLink slug={LEARN.MARKET_PRICE} /> ·{' '}
        <LearningLink slug={LEARN.FRACTIONAL_SHARES} />
      </section>
    </div>
  );
}
