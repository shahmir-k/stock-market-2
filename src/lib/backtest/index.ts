// Backtest math: given historical daily prices, simulate what would have
// happened if a user had invested a lump sum, a monthly DCA contribution,
// or a multi-asset portfolio starting on a past date.
//
// All money values here are in the asset's native currency. The UI layer
// converts to CAD when displaying. (Single-currency assumption keeps the
// math clean — for multi-currency portfolios the UI converts per asset.)

import type { HistoricalPricePoint } from '@/types/market';

export type BacktestValuePoint = {
  timestamp: string;
  /** Total portfolio value on this date, in the asset's native currency. */
  valueNative: number;
  /** Cumulative dollars contributed by this date (lump sum: constant; DCA: monthly increments). */
  contributedNative: number;
};

export type BacktestSummary = {
  contributedNative: number;
  finalValueNative: number;
  /** finalValue - contributed. */
  gainNative: number;
  /** Total return as a percent (gain / contributed × 100). 0 when contributed = 0. */
  totalReturnPercent: number;
  /** Compound Annual Growth Rate, percent. Uses years between first and last point. */
  cagrPercent: number;
  points: BacktestValuePoint[];
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function yearsBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / MS_PER_YEAR;
}

function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || years <= 0) return 0;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

// ---------------------------------------------------------------------------
// Lump sum: buy `dollars` worth on day 0, hold forever.
// ---------------------------------------------------------------------------

export function backtestLumpSum(
  prices: HistoricalPricePoint[],
  dollars: number,
): BacktestSummary {
  if (prices.length === 0 || dollars <= 0) {
    return {
      contributedNative: 0,
      finalValueNative: 0,
      gainNative: 0,
      totalReturnPercent: 0,
      cagrPercent: 0,
      points: [],
    };
  }
  const sorted = [...prices].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const startPrice = sorted[0].closeNative;
  if (startPrice <= 0) {
    return {
      contributedNative: dollars,
      finalValueNative: 0,
      gainNative: -dollars,
      totalReturnPercent: -100,
      cagrPercent: 0,
      points: [],
    };
  }
  const shares = dollars / startPrice;
  const points: BacktestValuePoint[] = sorted.map((p) => ({
    timestamp: p.timestamp,
    valueNative: shares * p.closeNative,
    contributedNative: dollars,
  }));
  const finalValue = points[points.length - 1].valueNative;
  const years = yearsBetween(sorted[0].timestamp, sorted[sorted.length - 1].timestamp);
  return {
    contributedNative: dollars,
    finalValueNative: finalValue,
    gainNative: finalValue - dollars,
    totalReturnPercent: ((finalValue - dollars) / dollars) * 100,
    cagrPercent: cagr(dollars, finalValue, years),
    points,
  };
}

// ---------------------------------------------------------------------------
// DCA: contribute `monthly` dollars on the first available trading day of
// each month, buy as many fractional shares as that buys at the day's price.
// ---------------------------------------------------------------------------

export function backtestDCA(
  prices: HistoricalPricePoint[],
  monthlyDollars: number,
): BacktestSummary {
  if (prices.length === 0 || monthlyDollars <= 0) {
    return {
      contributedNative: 0,
      finalValueNative: 0,
      gainNative: 0,
      totalReturnPercent: 0,
      cagrPercent: 0,
      points: [],
    };
  }
  const sorted = [...prices].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  let shares = 0;
  let contributed = 0;
  let lastContributionMonth = ''; // YYYY-MM
  const points: BacktestValuePoint[] = [];

  for (const p of sorted) {
    const monthKey = p.timestamp.slice(0, 7); // YYYY-MM
    if (monthKey !== lastContributionMonth && p.closeNative > 0) {
      shares += monthlyDollars / p.closeNative;
      contributed += monthlyDollars;
      lastContributionMonth = monthKey;
    }
    points.push({
      timestamp: p.timestamp,
      valueNative: shares * p.closeNative,
      contributedNative: contributed,
    });
  }

  const finalValue = points[points.length - 1].valueNative;
  const years = yearsBetween(sorted[0].timestamp, sorted[sorted.length - 1].timestamp);
  // CAGR for DCA: approximate using the average invested capital. Use the
  // time-weighted approximation — total contributions deployed roughly half
  // way through the period.
  const avgInvested = contributed / 2;
  return {
    contributedNative: contributed,
    finalValueNative: finalValue,
    gainNative: finalValue - contributed,
    totalReturnPercent:
      contributed > 0 ? ((finalValue - contributed) / contributed) * 100 : 0,
    cagrPercent: cagr(avgInvested, finalValue, years),
    points,
  };
}

// ---------------------------------------------------------------------------
// Lump-sum portfolio: multiple assets, each gets `allocationPct%` of the
// total lump sum on day 0. Combined value over time = sum of per-asset
// lump-sum values aligned on common dates.
// ---------------------------------------------------------------------------

export type PortfolioLeg = {
  symbol: string;
  allocationPct: number; // 0-100
  prices: HistoricalPricePoint[];
};

export function backtestLumpSumPortfolio(
  legs: PortfolioLeg[],
  totalDollars: number,
): BacktestSummary {
  if (legs.length === 0 || totalDollars <= 0) {
    return {
      contributedNative: 0,
      finalValueNative: 0,
      gainNative: 0,
      totalReturnPercent: 0,
      cagrPercent: 0,
      points: [],
    };
  }

  // Compute per-leg backtest results.
  const legResults = legs
    .filter((leg) => leg.prices.length > 0)
    .map((leg) => ({
      symbol: leg.symbol,
      result: backtestLumpSum(leg.prices, (leg.allocationPct / 100) * totalDollars),
    }));

  if (legResults.length === 0) {
    return {
      contributedNative: totalDollars,
      finalValueNative: 0,
      gainNative: -totalDollars,
      totalReturnPercent: -100,
      cagrPercent: 0,
      points: [],
    };
  }

  // Align on the union of all dates. For each date, use the most recent
  // value per leg (forward-fill missing days). Simple approach: index legs
  // by date string, sweep through merged sorted timeline.
  const dateSet = new Set<string>();
  for (const lr of legResults) for (const p of lr.result.points) dateSet.add(p.timestamp);
  const sortedDates = [...dateSet].sort();

  const lastByLeg = new Map<string, number>(); // symbol → last known value
  const pointsByDate = new Map<string, Map<string, number>>();
  for (const lr of legResults) {
    const m = new Map<string, number>();
    for (const p of lr.result.points) m.set(p.timestamp, p.valueNative);
    pointsByDate.set(lr.symbol, m);
  }

  const points: BacktestValuePoint[] = [];
  for (const date of sortedDates) {
    let total = 0;
    for (const lr of legResults) {
      const v = pointsByDate.get(lr.symbol)?.get(date);
      if (v !== undefined) lastByLeg.set(lr.symbol, v);
      const lastV = lastByLeg.get(lr.symbol);
      if (lastV !== undefined) total += lastV;
    }
    points.push({
      timestamp: date,
      valueNative: total,
      contributedNative: totalDollars,
    });
  }

  const finalValue = points[points.length - 1].valueNative;
  const years = yearsBetween(sortedDates[0], sortedDates[sortedDates.length - 1]);
  return {
    contributedNative: totalDollars,
    finalValueNative: finalValue,
    gainNative: finalValue - totalDollars,
    totalReturnPercent: ((finalValue - totalDollars) / totalDollars) * 100,
    cagrPercent: cagr(totalDollars, finalValue, years),
    points,
  };
}
