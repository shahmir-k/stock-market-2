'use client';

import { useState } from 'react';

import { BacktestChart } from '@/components/charts/BacktestChart';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import {
  type BacktestSummary,
  backtestLumpSum,
} from '@/lib/backtest';
import { getProvider } from '@/lib/market-data/provider';
import { useSimulatorStore } from '@/store/simulatorStore';

import {
  BacktestSummaryCards,
  MoneyInput,
  StartDatePicker,
  SymbolInput,
  defaultStartDate,
} from './BacktestShared';

type Mode = 'LUMP' | 'DCA';

export function BacktestSingleAsset({ mode }: { mode: Mode }) {
  const dataMode = useSimulatorStore((s) => s.marketDataMode);
  const [symbol, setSymbol] = useState('AAPL');
  const [startDate, setStartDate] = useState(defaultStartDate(5));
  const [amount, setAmount] = useState(mode === 'LUMP' ? 5000 : 200);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [currencyLabel, setCurrencyLabel] = useState('USD');

  const onRun = async () => {
    setRunning(true);
    setError(null);
    setSummary(null);
    try {
      const provider = getProvider(dataMode);
      const today = new Date().toISOString().slice(0, 10);
      // Fetch via the provider abstraction. For the API provider this
      // triggers /api/market/history with start_date/end_date.
      const url = `/api/market/history?symbol=${encodeURIComponent(symbol)}&interval=1day&start_date=${startDate}&end_date=${today}`;
      let points: Awaited<ReturnType<typeof provider.getHistoricalPrices>>;
      if (dataMode === 'API') {
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();
        if (!json.ok) {
          setError(json.error?.message ?? 'Failed to fetch history.');
          setRunning(false);
          return;
        }
        points = json.data.points;
      } else {
        // Mock mode — compute outputsize from the date range so monthly DCA
        // contributions span the full requested period (~252 trading days/yr).
        const startMs = new Date(startDate).getTime();
        const days = Math.max(
          30,
          Math.round(((Date.now() - startMs) / (1000 * 60 * 60 * 24)) * (252 / 365)),
        );
        points = await provider.getHistoricalPrices(symbol, days);
      }
      if (!points || points.length < 2) {
        setError('Not enough price history for that date range.');
        setRunning(false);
        return;
      }
      // Try to detect currency from a quote fetch (for label only).
      const q = await provider.getQuote(symbol).catch(() => null);
      if (q?.currency) setCurrencyLabel(q.currency);

      const result =
        mode === 'LUMP'
          ? backtestLumpSum(points, amount)
          : (await import('@/lib/backtest')).backtestDCA(points, amount);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backtest failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4">
        <SymbolInput value={symbol} onChange={setSymbol} />
        <StartDatePicker value={startDate} onChange={setStartDate} />
        <MoneyInput
          label={mode === 'LUMP' ? 'Lump sum amount' : 'Monthly contribution'}
          value={amount}
          onChange={setAmount}
        />
        <button
          type="button"
          onClick={() => void onRun()}
          disabled={running || !symbol || !startDate || amount <= 0}
          className="self-end rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {running ? 'Running…' : 'Run Backtest'}
        </button>
      </div>

      {running ? <LoadingState message="Fetching historical prices…" /> : null}
      {error ? <ErrorState title="Backtest failed" message={error} /> : null}
      {summary ? (
        <div className="space-y-4">
          <BacktestSummaryCards summary={summary} currencyLabel={currencyLabel} />
          <section className="rounded-xl border border-border bg-surface p-6">
            <h3 className="mb-3 text-base font-semibold">
              {symbol} value over time ({currencyLabel})
            </h3>
            <BacktestChart points={summary.points} currencyLabel={currencyLabel} />
          </section>
        </div>
      ) : null}
    </div>
  );
}
