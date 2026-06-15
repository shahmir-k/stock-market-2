'use client';

import { useState } from 'react';

import { BacktestChart } from '@/components/charts/BacktestChart';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Eyebrow } from '@/components/common/Eyebrow';
import { LoadingState } from '@/components/common/LoadingState';
import {
  type BacktestSummary,
  type PortfolioLeg,
  backtestLumpSumPortfolio,
} from '@/lib/backtest';
import { useSimulatorStore } from '@/store/simulatorStore';

import {
  BacktestSummaryCards,
  MoneyInput,
  StartDatePicker,
  SymbolInput,
  defaultStartDate,
} from './BacktestShared';

type LegInput = { symbol: string; allocationPct: number };

export function BacktestPortfolio() {
  const dataMode = useSimulatorStore((s) => s.marketDataMode);
  const [legs, setLegs] = useState<LegInput[]>([
    { symbol: 'AAPL', allocationPct: 50 },
    { symbol: 'MSFT', allocationPct: 50 },
  ]);
  const [startDate, setStartDate] = useState(defaultStartDate(5));
  const [totalDollars, setTotalDollars] = useState(5000);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);

  const totalAllocation = legs.reduce((s, l) => s + (l.allocationPct || 0), 0);
  const allocationValid = Math.abs(totalAllocation - 100) < 0.01;

  const onAddLeg = () =>
    setLegs((prev) => [...prev, { symbol: '', allocationPct: 0 }]);
  const onRemoveLeg = (i: number) =>
    setLegs((prev) => prev.filter((_, idx) => idx !== i));
  const onLegChange = (i: number, patch: Partial<LegInput>) =>
    setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const onRun = async () => {
    setRunning(true);
    setError(null);
    setSummary(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const fetched = await Promise.all(
        legs
          .filter((l) => l.symbol && l.allocationPct > 0)
          .map(async (l) => {
            if (dataMode === 'API') {
              const res = await fetch(
                `/api/market/history?symbol=${encodeURIComponent(l.symbol)}&interval=1day&start_date=${startDate}&end_date=${today}`,
                { cache: 'no-store' },
              );
              const json = await res.json();
              if (!json.ok) throw new Error(`${l.symbol}: ${json.error?.message ?? 'failed'}`);
              return {
                symbol: l.symbol,
                allocationPct: l.allocationPct,
                prices: json.data.points,
              } satisfies PortfolioLeg;
            }
            const startMs = new Date(startDate).getTime();
            const days = Math.max(
              30,
              Math.round(((Date.now() - startMs) / (1000 * 60 * 60 * 24)) * (252 / 365)),
            );
            const { mockHistory } = await import('@/lib/market-data/mock/mockAssets');
            const prices = mockHistory(l.symbol, days) ?? [];
            return {
              symbol: l.symbol,
              allocationPct: l.allocationPct,
              prices,
            } satisfies PortfolioLeg;
          }),
      );

      if (fetched.some((l) => l.prices.length < 2)) {
        setError('One or more symbols had no historical data for that range.');
        setRunning(false);
        return;
      }

      const result = backtestLumpSumPortfolio(fetched, totalDollars);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backtest failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Top-level inputs */}
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
        <StartDatePicker value={startDate} onChange={setStartDate} />
        <MoneyInput
          label="Total lump sum"
          value={totalDollars}
          onChange={setTotalDollars}
        />
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">Allocation sum</span>
          <div
            className={`tabular border-b pb-1 text-2xl font-display ${
              allocationValid
                ? 'text-[var(--color-success)] border-rule'
                : 'text-[var(--color-danger)] border-[var(--color-danger)]/40'
            }`}
          >
            {totalAllocation.toFixed(1)}%
          </div>
          {!allocationValid ? (
            <p className="text-xs text-[var(--color-danger)]">must equal 100%</p>
          ) : null}
        </div>
      </div>

      {/* Holdings rows */}
      <div className="space-y-4">
        <Eyebrow>Holdings</Eyebrow>
        {legs.map((leg, i) => (
          <div
            key={i}
            className="grid items-end gap-x-6 gap-y-3 border-b rule pb-4 sm:grid-cols-[1fr_140px_auto]"
          >
            <SymbolInput
              value={leg.symbol}
              onChange={(v) => onLegChange(i, { symbol: v })}
            />
            <label className="flex flex-col gap-1.5">
              <span className="eyebrow">Allocation</span>
              <span className="flex items-baseline gap-1 border-b rule pb-1">
                <input
                  type="number"
                  value={leg.allocationPct}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(e) =>
                    onLegChange(i, { allocationPct: Number(e.target.value) || 0 })
                  }
                  className="field-sizing-content min-w-0 bg-transparent font-display tabular text-2xl text-ink outline-none"
                />
                <span className="text-text-muted">%</span>
              </span>
            </label>
            <button
              type="button"
              onClick={() => onRemoveLeg(i)}
              disabled={legs.length === 1}
              className="self-end pb-2 text-sm text-text-secondary hover:text-[var(--color-danger)] disabled:opacity-40 transition-colors duration-[var(--dur-fast)]"
              aria-label="Remove holding"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAddLeg}
          className="text-sm text-[var(--color-accent)] underline-offset-4 hover:underline"
        >
          + Add another holding
        </button>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={() => void onRun()}
        disabled={running || !allocationValid || totalDollars <= 0}
        loading={running}
      >
        Run portfolio backtest →
      </Button>

      {running ? <LoadingState message="Fetching historical prices…" /> : null}
      {error ? <ErrorState title="Backtest failed" message={error} /> : null}
      {summary ? (
        <div className="space-y-10">
          <BacktestSummaryCards summary={summary} currencyLabel="USD" />
          <section>
            <header className="mb-4 border-b rule pb-3">
              <Eyebrow>Portfolio value over time</Eyebrow>
              <h3 className="font-display mt-2 text-xl text-ink">
                Combined (mixed currencies treated as USD)
              </h3>
            </header>
            <BacktestChart points={summary.points} currencyLabel="USD" />
          </section>
          <p className="max-w-prose text-xs text-text-muted">
            This calculator uses each asset&apos;s native currency. If you mix
            USD and CAD assets, values are summed without FX adjustment — pick
            one currency family for comparable results.
          </p>
        </div>
      ) : null}
    </div>
  );
}
