'use client';

import { useState } from 'react';

import { Backtest } from '@/components/compound/Backtest';
import { ForwardCompound } from '@/components/compound/ForwardCompound';

type Mode = 'FORWARD' | 'BACKTEST';

export default function CompoundGrowthPage() {
  const [mode, setMode] = useState<Mode>('FORWARD');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">
          {mode === 'FORWARD' ? 'Compound Growth Tool' : 'Historical Backtest'}
        </h1>
        <nav role="tablist" className="flex gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'FORWARD'}
            onClick={() => setMode('FORWARD')}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              mode === 'FORWARD'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-secondary hover:bg-surface-muted'
            }`}
          >
            Project Forward
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'BACKTEST'}
            onClick={() => setMode('BACKTEST')}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              mode === 'BACKTEST'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-secondary hover:bg-surface-muted'
            }`}
          >
            Backtest (Historical)
          </button>
        </nav>
      </header>

      {mode === 'FORWARD' ? <ForwardCompound /> : <Backtest />}
    </div>
  );
}
