'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { getProvider } from '@/lib/market-data/provider';
import { useSimulatorStore } from '@/store/simulatorStore';
import type { HistoricalPricePoint } from '@/types/market';

import { CHART_PALETTE, ensureChartRegistered, scaleDefaults } from './chartSetup';

ensureChartRegistered();

export function AssetHistoryChart({ symbol }: { symbol: string }) {
  const mode = useSimulatorStore((s) => s.marketDataMode);
  const [points, setPoints] = useState<HistoricalPricePoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
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
      <p className="text-sm text-text-secondary">
        Not enough historical data to render a chart.
      </p>
    );
  }

  const data = {
    labels: points.map((p) => p.timestamp.slice(0, 10)),
    datasets: [
      {
        label: 'Close',
        data: points.map((p) => p.closeNative),
        borderColor: CHART_PALETTE.ink,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.25,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: CHART_PALETTE.accent,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ...scaleDefaults(), ticks: { ...scaleDefaults().ticks, maxTicksLimit: 7 } },
      y: scaleDefaults(),
    },
  };

  return (
    <div className="h-80 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
