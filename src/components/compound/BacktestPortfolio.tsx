'use client';

import { useState } from 'react';

import { BacktestChart } from '@/components/charts/BacktestChart';
import { ErrorState } from '@/components/common/ErrorState';
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
      // Fetch history for each leg in parallel.
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
            // Mock fallback — compute outputsize from the date range so the
            // backtest spans the full requested period.
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
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <StartDatePicker value={startDate} onChange={setStartDate} />
          <MoneyInput
            label="Total lump sum"
            value={totalDollars}
            onChange={setTotalDollars}
          />
          <div className="flex flex-col text-sm">
            <span className="font-medium text-text-primary">
              Allocation sum
            </span>
            <div
              className={`mt-1 rounded-lg border px-3 py-2 text-sm ${
                allocationValid
                  ? 'border-border bg-surface text-text-primary'
                  : 'border-danger bg-danger/5 text-danger'
              }`}
            >
              {totalAllocation.toFixed(1)}% {allocationValid ? '' : '(must be 100%)'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-secondary">Holdings</h3>
          {legs.map((leg, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
              <SymbolInput
                label={i === 0 ? 'Symbol' : ''}
                value={leg.symbol}
                onChange={(v) => onLegChange(i, { symbol: v })}
              />
              <label className="flex flex-col text-sm">
                <span className="font-medium text-text-primary">
                  {i === 0 ? 'Allocation (%)' : ''}
                </span>
                <input
                  type="number"
                  value={leg.allocationPct}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(e) =>
                    onLegChange(i, { allocationPct: Number(e.target.value) || 0 })
                  }
                  className="mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => onRemoveLeg(i)}
                disabled={legs.length === 1}
                className="self-end rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted disabled:opacity-40"
                aria-label="Remove holding"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddLeg}
            className="mt-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted"
          >
            + Add holding
          </button>
        </div>

        <button
          type="button"
          onClick={() => void onRun()}
          disabled={running || !allocationValid || totalDollars <= 0}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {running ? 'Running…' : 'Run Portfolio Backtest'}
        </button>
      </div>

      {running ? <LoadingState message="Fetching historical prices…" /> : null}
      {error ? <ErrorState title="Backtest failed" message={error} /> : null}
      {summary ? (
        <div className="space-y-4">
          <BacktestSummaryCards summary={summary} currencyLabel="USD" />
          <section className="rounded-xl border border-border bg-surface p-6">
            <h3 className="mb-3 text-base font-semibold">
              Portfolio value over time (mixed currencies treated as USD)
            </h3>
            <BacktestChart points={summary.points} currencyLabel="USD" />
          </section>
          <p className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-text-secondary">
            Note: this calculator uses each asset&apos;s native currency. If
            you mix USD and CAD assets, values are summed without FX adjustment
            — pick one currency family for comparable results.
          </p>
        </div>
      ) : null}
    </div>
  );
}
