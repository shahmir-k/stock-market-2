'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { getProvider } from '@/lib/market-data/provider';
import { useSimulatorStore } from '@/store/simulatorStore';
import type { HistoricalPricePoint } from '@/types/market';

import { ensureChartRegistered } from './chartSetup';

ensureChartRegistered();

export function AssetHistoryChart({ symbol }: { symbol: string }) {
  const mode = useSimulatorStore((s) => s.marketDataMode);
  const [points, setPoints] = useState<HistoricalPricePoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const result = await getProvider(mode).getHistoricalPrices(symbol, 30);
        if (!cancelled) setPoints(result);
      } catch {
        if (!cancelled) setError('Unable to load historical prices.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, mode]);

  if (loading) return <LoadingState message="Loading chart…" />;
  if (error) return <ErrorState message={error} />;
  if (!points || points.length < 2) {
    return (
      <EmptyState message="Not enough historical data to render a chart." />
    );
  }

  const data = {
    labels: points.map((p) => new Date(p.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Close (native)',
        data: points.map((p) => p.closeNative),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.2,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
