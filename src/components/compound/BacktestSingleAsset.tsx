'use client';

import { useState } from 'react';

import { BacktestChart } from '@/components/charts/BacktestChart';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Eyebrow } from '@/components/common/Eyebrow';
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
    <div className="space-y-10">
      {/* Inputs — hairline underlines, no boxed card */}
      <div className="grid items-end gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <SymbolInput value={symbol} onChange={setSymbol} />
        <StartDatePicker value={startDate} onChange={setStartDate} />
        <MoneyInput
          label={mode === 'LUMP' ? 'Lump sum amount' : 'Monthly contribution'}
          value={amount}
          onChange={setAmount}
        />
        <Button
          variant="primary"
          size="md"
          onClick={() => void onRun()}
          disabled={running || !symbol || !startDate || amount <= 0}
          loading={running}
        >
          Run backtest →
        </Button>
      </div>

      {running ? <LoadingState message="Fetching historical prices…" /> : null}
      {error ? <ErrorState title="Backtest failed" message={error} /> : null}
      {summary ? (
        <div className="space-y-10">
          <BacktestSummaryCards summary={summary} currencyLabel={currencyLabel} />
          <section>
            <header className="mb-4 border-b rule pb-3">
              <Eyebrow>{symbol} value over time</Eyebrow>
              <h3 className="font-display mt-2 text-xl text-ink">
                In {currencyLabel}
              </h3>
            </header>
            <BacktestChart points={summary.points} currencyLabel={currencyLabel} />
          </section>
        </div>
      ) : null}
    </div>
  );
}
