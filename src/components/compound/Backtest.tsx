'use client';

import { useState } from 'react';

import { LearningLink } from '@/components/common/LearningLink';
import { LEARN } from '@/lib/learning';

import { BacktestPortfolio } from './BacktestPortfolio';
import { BacktestSingleAsset } from './BacktestSingleAsset';

type SubTab = 'lump' | 'dca' | 'portfolio';

const TABS: { id: SubTab; label: string; description: string }[] = [
  {
    id: 'lump',
    label: 'Single asset · lump sum',
    description:
      'Pick one stock or ETF, a past date, and a dollar amount. See how that single investment would have grown.',
  },
  {
    id: 'dca',
    label: 'Single asset · monthly DCA',
    description:
      "Pick one stock or ETF, a past date, and a monthly contribution. See what dollar-cost averaging would have produced.",
  },
  {
    id: 'portfolio',
    label: 'Multi-asset · lump sum',
    description:
      'Split a lump sum across multiple holdings on a past date. See how the portfolio would have grown over time.',
  },
];

export function Backtest() {
  const [sub, setSub] = useState<SubTab>('lump');
  const active = TABS.find((t) => t.id === sub)!;

  return (
    <div className="space-y-4">
      <nav role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={sub === t.id}
            onClick={() => setSub(t.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              sub === t.id
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-secondary hover:bg-surface-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <p className="text-sm text-text-secondary">{active.description}</p>

      {sub === 'lump' ? <BacktestSingleAsset mode="LUMP" /> : null}
      {sub === 'dca' ? <BacktestSingleAsset mode="DCA" /> : null}
      {sub === 'portfolio' ? <BacktestPortfolio /> : null}

      <p className="rounded-lg border border-info/30 bg-info/5 p-3 text-sm text-text-secondary">
        Backtests use real historical prices but are educational only. Past
        performance does not guarantee future returns. Trade fees, taxes, and
        dividends are not modeled.
      </p>
      <section className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
        Learn:{' '}
        <LearningLink slug={LEARN.COMPOUND_GROWTH} /> ·{' '}
        <LearningLink slug={LEARN.ANNUAL_RETURN} /> ·{' '}
        <LearningLink slug={LEARN.TIME_HORIZON} /> ·{' '}
        <LearningLink slug={LEARN.RISK_VS_REWARD} />
      </section>
    </div>
  );
}
