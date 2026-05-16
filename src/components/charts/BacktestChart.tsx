'use client';

import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { BacktestValuePoint } from '@/lib/backtest';

import { CHART_PALETTE, ensureChartRegistered, scaleDefaults } from './chartSetup';

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
      <p className="text-sm text-text-secondary">
        Not enough price history to render a chart.
      </p>
    );
  }

  const labels = points.map((p) => p.timestamp.slice(0, 10));
  const data = {
    labels,
    datasets: [
      {
        label: 'Contributions',
        data: points.map((p) => p.contributedNative),
        borderColor: CHART_PALETTE.textMuted,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.1,
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
      },
      {
        label: 'Portfolio value',
        data: points.map((p) => p.valueNative),
        borderColor: CHART_PALETTE.accent,
        backgroundColor: CHART_PALETTE.accentSoft,
        fill: true,
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
    plugins: {
      legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 14 } },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            `${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currencyLabel}`,
        },
      },
    },
    scales: {
      x: { ...scaleDefaults(), ticks: { ...scaleDefaults().ticks, maxTicksLimit: 7 } },
      y: {
        ...scaleDefaults(),
        ticks: {
          ...scaleDefaults().ticks,
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
