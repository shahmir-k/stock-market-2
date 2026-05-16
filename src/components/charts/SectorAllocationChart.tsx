'use client';

import type { TooltipItem } from 'chart.js';
import { Pie } from 'react-chartjs-2';

import { EmptyState } from '@/components/common/EmptyState';
import { sectorBreakdownCad } from '@/lib/calculations/portfolio';
import {
  selectCashCad,
  useSimulatorStore,
} from '@/store/simulatorStore';

import { ensureChartRegistered } from './chartSetup';

ensureChartRegistered();

const COLORS = [
  '#2563eb', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#64748b', // slate (cash)
];

export function SectorAllocationChart() {
  const holdings = useSimulatorStore((s) => s.portfolio.holdings);
  const cash = useSimulatorStore(selectCashCad);

  if (holdings.length === 0 && cash === 0) {
    return <EmptyState message="No allocation to show yet." />;
  }

  const breakdown = sectorBreakdownCad(holdings);
  // Append cash as its own slice (PRD §16).
  const labels = [...Object.keys(breakdown), 'Cash'];
  const values = [...Object.values(breakdown), cash];

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderColor: '#ffffff',
        borderWidth: 2,
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
          label: (ctx: TooltipItem<'pie'>) =>
            `${ctx.label}: $${Number(ctx.parsed).toFixed(2)}`,
        },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Pie data={data} options={options} />
    </div>
  );
}
