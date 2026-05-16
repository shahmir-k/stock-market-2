'use client';

import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';

import {
  selectPortfolioSnapshots,
  useSimulatorStore,
} from '@/store/simulatorStore';

import { CHART_PALETTE, ensureChartRegistered, scaleDefaults } from './chartSetup';

ensureChartRegistered();

export function PortfolioValueChart() {
  const snapshots = useSimulatorStore(selectPortfolioSnapshots);

  if (snapshots.length < 2) {
    return (
      <p className="text-sm text-text-secondary">
        The chart appears after a few portfolio snapshots are recorded — usually
        right after your first trade.
      </p>
    );
  }

  const data = {
    labels: snapshots.map((s) => new Date(s.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Portfolio value (CAD)',
        data: snapshots.map((s) => s.totalValueCad),
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
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            `$${(ctx.parsed.y ?? 0).toFixed(2)} CAD`,
        },
      },
    },
    scales: {
      x: { ...scaleDefaults(), ticks: { ...scaleDefaults().ticks, maxTicksLimit: 6 } },
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
    <div className="h-72 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
