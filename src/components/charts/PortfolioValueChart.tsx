'use client';

import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';

import { EmptyState } from '@/components/common/EmptyState';
import {
  selectPortfolioSnapshots,
  useSimulatorStore,
} from '@/store/simulatorStore';

import { ensureChartRegistered } from './chartSetup';

ensureChartRegistered();

export function PortfolioValueChart() {
  const snapshots = useSimulatorStore(selectPortfolioSnapshots);

  if (snapshots.length < 2) {
    return (
      <EmptyState message="Your portfolio chart will appear after more portfolio snapshots are recorded." />
    );
  }

  const data = {
    labels: snapshots.map((s) => new Date(s.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Portfolio Value (CAD)',
        data: snapshots.map((s) => s.totalValueCad),
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
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            `$${(ctx.parsed.y ?? 0).toFixed(2)} CAD`,
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
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
