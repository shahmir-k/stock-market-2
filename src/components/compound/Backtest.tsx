'use client';

import { useState } from 'react';

import { LearningLink } from '@/components/common/LearningLink';
import { Tabs } from '@/components/common/Tabs';
import { LEARN } from '@/lib/learning';

import { BacktestPortfolio } from './BacktestPortfolio';
import { BacktestSingleAsset } from './BacktestSingleAsset';

type SubTab = 'lump' | 'dca' | 'portfolio';

const TABS = [
  {
    id: 'lump' as const,
    label: 'Single asset · lump sum',
    description:
      'Pick one stock or ETF, a past date, and a dollar amount. See how that single investment would have grown.',
  },
  {
    id: 'dca' as const,
    label: 'Single asset · monthly DCA',
    description:
      'Pick one stock or ETF, a past date, and a monthly contribution. See what dollar-cost averaging would have produced.',
  },
  {
    id: 'portfolio' as const,
    label: 'Multi-asset · lump sum',
    description:
      'Split a lump sum across multiple holdings on a past date. See how the portfolio would have grown over time.',
  },
];

export function Backtest() {
  const [sub, setSub] = useState<SubTab>('lump');
  const active = TABS.find((t) => t.id === sub)!;

  return (
    <div className="space-y-8">
      <Tabs<SubTab>
        items={TABS.map((t) => ({ id: t.id, label: t.label }))}
        active={sub}
        onChange={setSub}
      />

      <p className="max-w-prose text-sm text-text-secondary">
        {active.description}
      </p>

      {sub === 'lump' ? <BacktestSingleAsset mode="LUMP" /> : null}
      {sub === 'dca' ? <BacktestSingleAsset mode="DCA" /> : null}
      {sub === 'portfolio' ? <BacktestPortfolio /> : null}

      <p className="max-w-prose text-sm text-text-secondary">
        Backtests use real historical prices but are educational only. Past
        performance does not guarantee future returns. Trade fees, taxes, and
        dividends are not modeled.
      </p>
      <section className="border-t rule pt-6 text-sm text-text-muted">
        Read:{' '}
        <LearningLink slug={LEARN.COMPOUND_GROWTH} /> ·{' '}
        <LearningLink slug={LEARN.ANNUAL_RETURN} /> ·{' '}
        <LearningLink slug={LEARN.TIME_HORIZON} /> ·{' '}
        <LearningLink slug={LEARN.RISK_VS_REWARD} />
      </section>
    </div>
  );
}
