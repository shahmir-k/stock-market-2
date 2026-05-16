'use client';

// Centralized Chart.js registration + global theme.
//
// All chart wrappers import `ensureChartRegistered()` from here. Global
// defaults apply once and propagate to every chart (no per-component config
// for fonts, colors, grids, tooltips). Single accent (ink burgundy) is the
// only colored line; everything else is grey ink or hairline.

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

// Brand-aligned palette. Mirrors --color tokens in globals.css.
export const CHART_PALETTE = {
  ink: '#1A1714',
  textMuted: '#8C857C',
  rule: 'rgba(17, 17, 17, 0.08)',
  ruleStrong: 'rgba(17, 17, 17, 0.16)',
  accent: '#6B1F2A',
  accentSoft: 'rgba(107, 31, 42, 0.08)',
  success: '#346538',
  danger: '#9F2F2D',
  // 9-step categorical palette for pie/treemap. Desaturated, warm-leaning.
  categorical: [
    '#6B1F2A', // ink burgundy (accent)
    '#3F4F40', // moss
    '#7A5C3A', // tobacco
    '#8C7F6E', // stone
    '#5D6A75', // slate
    '#A06A47', // clay
    '#52605C', // sage
    '#9D4D4D', // muted rust
    '#8C857C', // canvas muted
  ],
} as const;

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

  // Global typography
  ChartJS.defaults.font.family =
    '"Geist", "SF Pro Text", system-ui, sans-serif';
  ChartJS.defaults.font.size = 12;
  ChartJS.defaults.color = CHART_PALETTE.textMuted;

  // No default legend except where we explicitly enable it
  ChartJS.defaults.plugins.legend.display = false;

  // Tooltip theme — light card, ink text, no shadow
  ChartJS.defaults.plugins.tooltip = {
    ...ChartJS.defaults.plugins.tooltip,
    backgroundColor: '#FBFBFA',
    titleColor: CHART_PALETTE.ink,
    bodyColor: CHART_PALETTE.ink,
    titleFont: { family: '"Newsreader Variable", Georgia, serif', weight: 600, size: 13 },
    bodyFont: { family: '"Geist Mono", monospace', size: 12 },
    padding: 12,
    borderColor: CHART_PALETTE.rule,
    borderWidth: 1,
    boxPadding: 4,
    cornerRadius: 6,
    displayColors: false,
  };

  // Grid + ticks: hairline, no ticks
  // (Chart.js applies these via scale defaults; per-chart can override)
  registered = true;
}

// Common scale defaults — apply via spread { ...scaleDefaults(), ...overrides }
export function scaleDefaults() {
  return {
    grid: { color: CHART_PALETTE.rule, drawTicks: false, lineWidth: 1 },
    border: { display: false },
    ticks: { color: CHART_PALETTE.textMuted, padding: 8 },
  };
}
