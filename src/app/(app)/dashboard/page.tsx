'use client';

import Link from 'next/link';

import { PortfolioValueChart } from '@/components/charts/PortfolioValueChart';
import { LatestWarningCard } from '@/components/dashboard/LatestWarningCard';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { LearningLink } from '@/components/common/LearningLink';
import { MetricCard } from '@/components/common/MetricCard';
import { ReturnValue } from '@/components/common/ReturnValue';
import { StaleQuoteBanner } from '@/components/common/StaleQuoteBanner';
import { useQuoteRefresh } from '@/lib/market-data/useQuoteRefresh';
import { LEARN } from '@/lib/learning';
import {
  selectCashCad,
  selectInvestedValueCad,
  selectPortfolioValueCad,
  selectRecentTransactions,
  selectTotalReturnCad,
  selectTotalReturnPercent,
  useSimulatorStore,
} from '@/store/simulatorStore';

export default function DashboardPage() {
  useQuoteRefresh();

  const total = useSimulatorStore(selectPortfolioValueCad);
  const cash = useSimulatorStore(selectCashCad);
  const invested = useSimulatorStore(selectInvestedValueCad);
  const returnCad = useSimulatorStore(selectTotalReturnCad);
  const returnPct = useSimulatorStore(selectTotalReturnPercent);
  const recentTx = useSimulatorStore(selectRecentTransactions);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <StaleQuoteBanner />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Portfolio" value={<CurrencyValue value={total} />} />
        <MetricCard
          label="Return"
          value={<ReturnValue cad={returnCad} percent={returnPct} layout="stacked" />}
        />
        <MetricCard label="Cash" value={<CurrencyValue value={cash} />} />
        <MetricCard label="Invested" value={<CurrencyValue value={invested} />} />
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6 lg:col-span-2">
          <h2 className="text-base font-semibold">Portfolio Value Over Time</h2>
          <div className="mt-4">
            <PortfolioValueChart />
          </div>
        </div>
        <div className="space-y-4">
          <LatestWarningCard />
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-base font-semibold">Next Action</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Browse stocks or ETFs to make your first trade.
          </p>
          <div className="mt-4">
            <Link
              href="/browse"
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Browse
            </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold">Recent Trades</h2>
        {recentTx.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">No trades yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {recentTx.slice(0, 5).map((t) => (
              <li key={t.id} className="flex justify-between py-2">
                <span>
                  <span
                    className={`mr-2 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                      t.type === 'BUY'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-warning/15 text-warning'
                    }`}
                  >
                    {t.type}
                  </span>
                  {t.symbol} · {t.quantity} shares
                </span>
                <span className="tabular text-text-secondary">
                  <CurrencyValue value={t.totalCad} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
        Learn:{' '}
        <LearningLink slug={LEARN.PORTFOLIO_VALUE} /> ·{' '}
        <LearningLink slug={LEARN.TOTAL_RETURN} /> ·{' '}
        <LearningLink slug={LEARN.DIVERSIFICATION} />
      </section>
    </div>
  );
}
