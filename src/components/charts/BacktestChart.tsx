'use client';

import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { BacktestValuePoint } from '@/lib/backtest';

import { ensureChartRegistered } from './chartSetup';

ensureChartRegistered();

export function BacktestChart({
  points,
  currencyLabel = 'USD',
}: {
  points: BacktestValuePoint[];
  currencyLabel?: string;
}) {
  if (points.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-text-secondary">
        Not enough price history to render a chart.
      </div>
    );
  }

  const labels = points.map((p) => p.timestamp.slice(0, 10));
  const data = {
    labels,
    datasets: [
      {
        label: 'Contributions',
        data: points.map((p) => p.contributedNative),
        borderColor: 'rgb(100, 116, 139)',
        backgroundColor: 'rgba(100, 116, 139, 0.05)',
        fill: false,
        tension: 0.1,
        pointRadius: 0,
      },
      {
        label: 'Portfolio value',
        data: points.map((p) => p.valueNative),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 0,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            `${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toFixed(0)} ${currencyLabel}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 8,
          autoSkip: true,
        },
      },
      y: {
        ticks: {
          callback: (v: string | number) =>
            `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      },
    },
  };
  return (
    <div className="h-80 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
