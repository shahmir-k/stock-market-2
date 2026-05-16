'use client';

import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { CompoundYearPoint } from '@/lib/compound';

import { ensureChartRegistered } from './chartSetup';

ensureChartRegistered();

export function CompoundGrowthChart({ points }: { points: CompoundYearPoint[] }) {
  const data = {
    labels: points.map((p) => `Y${p.year}`),
    datasets: [
      {
        label: 'Contributions only',
        data: points.map((p) => p.contributedCad),
        borderColor: 'rgb(100, 116, 139)',
        backgroundColor: 'rgba(100, 116, 139, 0.05)',
        fill: false,
        tension: 0.1,
      },
      {
        label: 'Contributions + compound growth',
        data: points.map((p) => p.futureValueCad),
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
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            `${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toFixed(0)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v: string | number) => `$${Number(v).toFixed(0)}`,
        },
      },
    },
  };
  return (
    <div className="h-72 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
