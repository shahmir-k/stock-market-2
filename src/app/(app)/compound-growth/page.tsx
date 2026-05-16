'use client';

import { useState } from 'react';

import { Eyebrow } from '@/components/common/Eyebrow';
import { Tabs } from '@/components/common/Tabs';
import { Backtest } from '@/components/compound/Backtest';
import { ForwardCompound } from '@/components/compound/ForwardCompound';

type Mode = 'FORWARD' | 'BACKTEST';

const TABS = [
  { id: 'FORWARD' as const, label: 'Project forward' },
  { id: 'BACKTEST' as const, label: 'Backtest (historical)' },
];

export default function CompoundGrowthPage() {
  const [mode, setMode] = useState<Mode>('FORWARD');

  const heading =
    mode === 'FORWARD'
      ? { eyebrow: 'Forward calculator', title: 'Project the future.' }
      : { eyebrow: 'Historical backtest', title: 'Look at the past.' };

  return (
    <div className="space-y-12">
      <section className="fade-up">
        <Eyebrow>{heading.eyebrow}</Eyebrow>
        <h1 className="font-display mt-3 text-5xl tracking-tight text-ink md:text-7xl">
          {mode === 'FORWARD' ? (
            <>
              Project the
              <br />
              <em className="text-[var(--color-accent)]">future.</em>
            </>
          ) : (
            <>
              Look at the
              <br />
              <em className="text-[var(--color-accent)]">past.</em>
            </>
          )}
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-text-secondary">
          {mode === 'FORWARD'
            ? 'Set a starting amount, a monthly contribution, an expected annual return, and a time horizon. See what compounding can do over time.'
            : 'Pick a real ticker and a real past date. See what would have actually happened to a lump sum, a monthly contribution, or a multi-asset portfolio.'}
        </p>
      </section>

      <section className="fade-up" style={{ animationDelay: '60ms' }}>
        <Tabs<Mode> items={TABS} active={mode} onChange={setMode} />
      </section>

      <section className="fade-up" style={{ animationDelay: '120ms' }}>
        {mode === 'FORWARD' ? <ForwardCompound /> : <Backtest />}
      </section>
    </div>
  );
}
