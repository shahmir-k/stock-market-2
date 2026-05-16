'use client';

// Centralized Chart.js registration. Import once from any chart wrapper.

import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';

let registered = false;

export function ensureChartRegistered() {
  if (registered) return;
  ChartJS.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    ArcElement,
    Filler,
    Title,
    Tooltip,
    Legend,
  );
  registered = true;
}
