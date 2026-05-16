'use client';

import { useEffect } from 'react';

import { SectorAllocationChart } from '@/components/charts/SectorAllocationChart';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { Eyebrow } from '@/components/common/Eyebrow';
import { Kpi } from '@/components/common/Kpi';
import { LearningLink } from '@/components/common/LearningLink';
import { StatStrip } from '@/components/dashboard/StatStrip';
import { HoldingsTable } from '@/components/portfolio/HoldingsTable';
import { TransactionHistoryTable } from '@/components/portfolio/TransactionHistoryTable';
import { LEARN } from '@/lib/learning';
import {
  selectPortfolioValueCad,
  selectRealizedGainLossCad,
  selectTotalReturnCad,
  selectTotalReturnPercent,
  selectUnrealizedGainLossCad,
  useSimulatorStore,
} from '@/store/simulatorStore';

export default function PortfolioPage() {
  const refreshHoldingQuotes = useSimulatorStore(
    (s) => s.refreshHoldingQuotes,
  );
  const isHydrated = useSimulatorStore((s) => s.isHydrated);
  const marketDataMode = useSimulatorStore((s) => s.marketDataMode);

  const total = useSimulatorStore(selectPortfolioValueCad);
  const returnCad = useSimulatorStore(selectTotalReturnCad);
  const returnPct = useSimulatorStore(selectTotalReturnPercent);
  const realized = useSimulatorStore(selectRealizedGainLossCad);
  const unrealized = useSimulatorStore(selectUnrealizedGainLossCad);
  const isPositive = returnCad >= 0;

  useEffect(() => {
    if (!isHydrated) return;
    void refreshHoldingQuotes();
  }, [refreshHoldingQuotes, isHydrated, marketDataMode]);

  return (
    <div className="space-y-12">
      {/* Hero — total value + return summary */}
      <section className="fade-up">
        <Eyebrow>Portfolio</Eyebrow>
        <h1 className="font-display mt-3 text-5xl tracking-tight text-ink md:text-7xl tabular">
          <CurrencyValue value={total} />
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          <span
            className={`tabular ${
              isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
            }`}
          >
            {isPositive ? '+' : ''}
            <CurrencyValue value={returnCad} />
            {' · '}
            {isPositive ? '+' : ''}
            {returnPct.toFixed(2)}%
          </span>{' '}
          <span className="text-text-muted">total return since you started</span>
        </p>
      </section>

      <section className="fade-up" style={{ animationDelay: '60ms' }}>
        <StatStrip />
      </section>

      {/* Realized vs Unrealized — inline editorial copy, no boxed card */}
      <section className="fade-up max-w-prose space-y-4" style={{ animationDelay: '120ms' }}>
        <Eyebrow>Reading these numbers</Eyebrow>
        <p className="text-sm leading-relaxed text-text-secondary">
          Your{' '}
          <LearningLink slug={LEARN.REALIZED_GAIN_LOSS}>realized gain</LearningLink>
          {' '}of{' '}
          <span
            className={`tabular ${
              realized >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
            }`}
          >
            <CurrencyValue value={realized} showSign />
          </span>
          {' '}is what you have locked in by selling. Your{' '}
          <LearningLink slug={LEARN.UNREALIZED_GAIN_LOSS}>unrealized gain</LearningLink>
          {' '}of{' '}
          <span
            className={`tabular ${
              unrealized >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
            }`}
          >
            <CurrencyValue value={unrealized} showSign />
          </span>
          {' '}is paper profit on positions you still own — it moves with the
          market until you sell.
        </p>
      </section>

      {/* Holdings + sector allocation */}
      <section className="fade-up grid gap-12 md:grid-cols-3 md:gap-10" style={{ animationDelay: '180ms' }}>
        <div className="md:col-span-2">
          <header className="border-b rule pb-3">
            <Eyebrow>Open positions</Eyebrow>
            <h2 className="font-display mt-2 text-2xl text-ink">Holdings</h2>
          </header>
          <div className="mt-4">
            <HoldingsTable />
          </div>
        </div>
        <aside>
          <Eyebrow>Allocation</Eyebrow>
          <h2 className="font-display mt-2 text-2xl text-ink">By sector</h2>
          <div className="mt-4">
            <SectorAllocationChart />
          </div>
        </aside>
      </section>

      {/* Transaction history timeline */}
      <section className="fade-up" style={{ animationDelay: '240ms' }}>
        <header className="mb-6 border-b rule pb-3">
          <Eyebrow>Activity log</Eyebrow>
          <h2 className="font-display mt-2 text-2xl text-ink">
            Transaction history
          </h2>
        </header>
        <TransactionHistoryTable />
      </section>

      <section className="fade-up border-t rule pt-6 text-sm text-text-muted" style={{ animationDelay: '300ms' }}>
        Read:{' '}
        <LearningLink slug={LEARN.PORTFOLIO} /> ·{' '}
        <LearningLink slug={LEARN.COST_BASIS} /> ·{' '}
        <LearningLink slug={LEARN.REALIZED_GAIN_LOSS} /> ·{' '}
        <LearningLink slug={LEARN.ALLOCATION} />
      </section>
    </div>
  );
}
