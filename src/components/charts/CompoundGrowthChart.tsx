'use client';

import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { CompoundYearPoint } from '@/lib/compound';

import { CHART_PALETTE, ensureChartRegistered, scaleDefaults } from './chartSetup';

ensureChartRegistered();

export function CompoundGrowthChart({ points }: { points: CompoundYearPoint[] }) {
  const data = {
    labels: points.map((p) => `Y${p.year}`),
    datasets: [
      {
        label: 'Contributions',
        data: points.map((p) => p.contributedCad),
        borderColor: CHART_PALETTE.textMuted,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.15,
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
      },
      {
        label: 'With compounding',
        data: points.map((p) => p.futureValueCad),
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
            `${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      },
    },
    scales: {
      x: scaleDefaults(),
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
