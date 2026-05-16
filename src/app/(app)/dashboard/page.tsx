'use client';

import Link from 'next/link';

import { PortfolioValueChart } from '@/components/charts/PortfolioValueChart';
import { Button } from '@/components/common/Button';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { Eyebrow } from '@/components/common/Eyebrow';
import { LatestWarningCard } from '@/components/dashboard/LatestWarningCard';
import { RecentTradesList } from '@/components/dashboard/RecentTradesList';
import { StatStrip } from '@/components/dashboard/StatStrip';
import { useQuoteRefresh } from '@/lib/market-data/useQuoteRefresh';
import {
  selectPortfolioValueCad,
  selectTotalReturnCad,
  selectTotalReturnPercent,
  useSimulatorStore,
} from '@/store/simulatorStore';

export default function DashboardPage() {
  useQuoteRefresh();

  const total = useSimulatorStore(selectPortfolioValueCad);
  const returnCad = useSimulatorStore(selectTotalReturnCad);
  const returnPct = useSimulatorStore(selectTotalReturnPercent);
  const displayName = useSimulatorStore((s) => s.user?.displayName);
  const isPositive = returnCad >= 0;

  return (
    <div className="space-y-12">
      {/* Hero: greeting + giant serif portfolio value + signed return */}
      <section className="fade-up">
        <Eyebrow>{displayName ? `Hello, ${displayName}` : 'Your portfolio'}</Eyebrow>
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
          <span className="text-text-muted">since you started</span>
        </p>
      </section>

      {/* Inline stat strip: Cash · Invested · Realized · Unrealized */}
      <section className="fade-up" style={{ animationDelay: '60ms' }}>
        <StatStrip />
      </section>

      {/* Asymmetric Bento: chart (2/3) + warning (1/3) */}
      <section className="fade-up grid gap-12 md:grid-cols-3 md:gap-10" style={{ animationDelay: '120ms' }}>
        <div className="md:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Eyebrow>Portfolio value</Eyebrow>
              <h2 className="font-display mt-2 text-2xl text-ink">Over time</h2>
            </div>
          </div>
          <div className="mt-6">
            <PortfolioValueChart />
          </div>
        </div>
        <aside>
          <LatestWarningCard />
        </aside>
      </section>

      {/* Recent trades + next action */}
      <section className="fade-up grid gap-12 md:grid-cols-3 md:gap-10" style={{ animationDelay: '180ms' }}>
        <div className="md:col-span-2">
          <div className="flex items-end justify-between gap-3 border-b rule pb-3">
            <div>
              <Eyebrow>Activity</Eyebrow>
              <h2 className="font-display mt-2 text-2xl text-ink">Recent trades</h2>
            </div>
            <Link
              href="/portfolio"
              className="text-sm text-text-secondary hover:text-ink transition-colors duration-[var(--dur-fast)]"
            >
              All transactions →
            </Link>
          </div>
          <div className="mt-4">
            <RecentTradesList limit={5} />
          </div>
        </div>
        <aside>
          <Eyebrow>Next move</Eyebrow>
          <h3 className="font-display mt-2 text-xl text-ink">
            What looks interesting today?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Browse stocks and ETFs across NASDAQ, NYSE, NYSE Arca, and TSX.
            Search by ticker or company name.
          </p>
          <div className="mt-4">
            <Link href="/browse">
              <Button variant="primary" size="md">
                Browse markets →
              </Button>
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
