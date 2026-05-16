'use client';

import { useEffect } from 'react';

import { SectorAllocationChart } from '@/components/charts/SectorAllocationChart';
import { LearningLink } from '@/components/common/LearningLink';
import { HoldingsTable } from '@/components/portfolio/HoldingsTable';
import { PortfolioSummaryCards } from '@/components/portfolio/PortfolioSummaryCards';
import { RealizedUnrealizedExplainer } from '@/components/portfolio/RealizedUnrealizedExplainer';
import { TransactionHistoryTable } from '@/components/portfolio/TransactionHistoryTable';
import { LEARN } from '@/lib/learning';
import {
  selectRealizedGainLossCad,
  selectUnrealizedGainLossCad,
  useSimulatorStore,
} from '@/store/simulatorStore';

export default function PortfolioPage() {
  const refreshHoldingQuotes = useSimulatorStore(
    (s) => s.refreshHoldingQuotes,
  );
  const realized = useSimulatorStore(selectRealizedGainLossCad);
  const unrealized = useSimulatorStore(selectUnrealizedGainLossCad);
  // Gate on hydration + re-run when mode flips, otherwise refresh fires with
  // the default 'API' mode before Supabase load completes (or never re-fires
  // after a MOCK toggle), leaving holdings showing "Unavailable" forever.
  const isHydrated = useSimulatorStore((s) => s.isHydrated);
  const marketDataMode = useSimulatorStore((s) => s.marketDataMode);

  useEffect(() => {
    if (!isHydrated) return;
    void refreshHoldingQuotes();
  }, [refreshHoldingQuotes, isHydrated, marketDataMode]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Portfolio</h1>

      <PortfolioSummaryCards />

      <RealizedUnrealizedExplainer
        realizedCad={realized}
        unrealizedCad={unrealized}
      />

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-base font-semibold">Sector Allocation</h2>
        <SectorAllocationChart />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Holdings</h2>
        <HoldingsTable />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Transaction History</h2>
        <TransactionHistoryTable />
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
        Learn:{' '}
        <LearningLink slug={LEARN.PORTFOLIO} /> ·{' '}
        <LearningLink slug={LEARN.COST_BASIS} /> ·{' '}
        <LearningLink slug={LEARN.REALIZED_GAIN_LOSS} /> ·{' '}
        <LearningLink slug={LEARN.ALLOCATION} />
      </section>
    </div>
  );
}
