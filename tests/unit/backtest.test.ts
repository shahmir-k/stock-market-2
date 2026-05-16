// Backtest math — covers backtestLumpSum, backtestDCA, and
// backtestLumpSumPortfolio. Pure-function tests; no provider calls.
// CAGR uses (end/start)^(1/years) - 1 so we test against known formulas.

import { describe, expect, it } from 'vitest';

import {
  backtestDCA,
  backtestLumpSum,
  backtestLumpSumPortfolio,
} from '@/lib/backtest';
import type { HistoricalPricePoint } from '@/types/market';

// ----- Fixtures ------------------------------------------------------------

// Generate N daily points starting at `from`, prices interpolated linearly
// from `startPrice` to `endPrice`.
function linearPrices(
  startISO: string,
  endISO: string,
  startPrice: number,
  endPrice: number,
  step = 1, // days
): HistoricalPricePoint[] {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  const points: HistoricalPricePoint[] = [];
  for (let i = 0; i <= totalDays; i += step) {
    const t = i / Math.max(totalDays, 1);
    const close = startPrice + (endPrice - startPrice) * t;
    const ts = new Date(start + i * 24 * 60 * 60 * 1000).toISOString();
    points.push({
      timestamp: ts,
      openNative: close,
      highNative: close,
      lowNative: close,
      closeNative: close,
    });
  }
  return points;
}

// ===========================================================================
// LUMP SUM
// ===========================================================================

describe('backtestLumpSum', () => {
  it('U-BKT-001: empty prices returns zero summary', () => {
    const r = backtestLumpSum([], 5000);
    expect(r).toEqual({
      contributedNative: 0,
      finalValueNative: 0,
      gainNative: 0,
      totalReturnPercent: 0,
      cagrPercent: 0,
      points: [],
    });
  });

  it('U-BKT-002: dollars ≤ 0 returns zero summary', () => {
    const prices = linearPrices('2025-01-01', '2025-12-31', 100, 200);
    expect(backtestLumpSum(prices, 0).finalValueNative).toBe(0);
    expect(backtestLumpSum(prices, -100).finalValueNative).toBe(0);
  });

  it('U-BKT-003: 2x growth (100→200) gives +100% return', () => {
    const prices = linearPrices('2025-01-01', '2025-12-31', 100, 200);
    const r = backtestLumpSum(prices, 1000);
    expect(r.contributedNative).toBe(1000);
    expect(r.finalValueNative).toBeCloseTo(2000, 0);
    expect(r.gainNative).toBeCloseTo(1000, 0);
    expect(r.totalReturnPercent).toBeCloseTo(100, 0);
  });

  it('U-BKT-004: 50% loss reports negative gain', () => {
    const prices = linearPrices('2025-01-01', '2025-12-31', 200, 100);
    const r = backtestLumpSum(prices, 1000);
    expect(r.finalValueNative).toBeCloseTo(500, 0);
    expect(r.gainNative).toBeCloseTo(-500, 0);
    expect(r.totalReturnPercent).toBeCloseTo(-50, 0);
  });

  it('U-BKT-005: CAGR over 5y constant growth matches (end/start)^(1/5)-1', () => {
    // 100 → 200 over ~5 years should be ~14.87% CAGR
    const prices = linearPrices('2020-01-01', '2024-12-31', 100, 200);
    const r = backtestLumpSum(prices, 1000);
    expect(r.cagrPercent).toBeGreaterThan(14);
    expect(r.cagrPercent).toBeLessThan(16);
  });

  it('U-BKT-006: unsorted prices are sorted chronologically', () => {
    const sorted = linearPrices('2025-01-01', '2025-12-31', 100, 200);
    const reversed = [...sorted].reverse();
    const r1 = backtestLumpSum(sorted, 1000);
    const r2 = backtestLumpSum(reversed, 1000);
    expect(r2.finalValueNative).toBeCloseTo(r1.finalValueNative, 2);
    expect(r2.points[0].timestamp).toBe(sorted[0].timestamp);
  });

  it('U-BKT-007: startPrice ≤ 0 returns -100% safely', () => {
    const broken = [
      { timestamp: '2025-01-01T00:00Z', openNative: 0, highNative: 0, lowNative: 0, closeNative: 0 },
      { timestamp: '2025-06-01T00:00Z', openNative: 50, highNative: 50, lowNative: 50, closeNative: 50 },
    ];
    const r = backtestLumpSum(broken, 1000);
    expect(r.contributedNative).toBe(1000);
    expect(r.finalValueNative).toBe(0);
    expect(r.totalReturnPercent).toBe(-100);
  });

  it('contributedNative on every point equals the lump sum', () => {
    const prices = linearPrices('2025-01-01', '2025-12-31', 100, 200);
    const r = backtestLumpSum(prices, 5000);
    expect(r.points.every((p) => p.contributedNative === 5000)).toBe(true);
  });
});

// ===========================================================================
// DCA
// ===========================================================================

describe('backtestDCA', () => {
  it('U-BKT-008: empty prices returns zero', () => {
    const r = backtestDCA([], 200);
    expect(r.finalValueNative).toBe(0);
    expect(r.points).toEqual([]);
  });

  it('U-BKT-009: contributes once per unique calendar month', () => {
    // 3 months × ~30 days = ~90 daily points; expect 3 monthly contributions
    const prices = linearPrices('2025-01-01', '2025-03-31', 100, 100);
    const r = backtestDCA(prices, 200);
    expect(r.contributedNative).toBe(600); // 3 months × $200
  });

  it('U-BKT-010: skips contribution on days where price ≤ 0', () => {
    const points: HistoricalPricePoint[] = [
      { timestamp: '2025-01-01T00:00Z', openNative: 0, highNative: 0, lowNative: 0, closeNative: 0 },
      { timestamp: '2025-02-01T00:00Z', openNative: 100, highNative: 100, lowNative: 100, closeNative: 100 },
    ];
    const r = backtestDCA(points, 200);
    // January skipped (price 0), February contributed
    expect(r.contributedNative).toBe(200);
  });

  it('U-BKT-011: total contributed = months × monthly', () => {
    const prices = linearPrices('2025-01-01', '2025-12-31', 100, 100);
    const r = backtestDCA(prices, 100);
    expect(r.contributedNative).toBe(1200); // 12 months × $100
  });

  it('U-BKT-012: CAGR is computed even with monthly contributions', () => {
    const prices = linearPrices('2020-01-01', '2024-12-31', 100, 200);
    const r = backtestDCA(prices, 100);
    expect(r.cagrPercent).toBeGreaterThan(0); // growth period → positive
  });

  it('produces a point per price day, contributedNative monotonically increases', () => {
    const prices = linearPrices('2025-01-01', '2025-03-31', 100, 100);
    const r = backtestDCA(prices, 200);
    expect(r.points.length).toBe(prices.length);
    for (let i = 1; i < r.points.length; i++) {
      expect(r.points[i].contributedNative).toBeGreaterThanOrEqual(
        r.points[i - 1].contributedNative,
      );
    }
  });
});

// ===========================================================================
// PORTFOLIO
// ===========================================================================

describe('backtestLumpSumPortfolio', () => {
  it('U-BKT-013: empty legs returns zero summary', () => {
    const r = backtestLumpSumPortfolio([], 5000);
    expect(r.finalValueNative).toBe(0);
    expect(r.points).toEqual([]);
  });

  it('U-BKT-014: totalDollars ≤ 0 returns zero summary', () => {
    const r = backtestLumpSumPortfolio(
      [{ symbol: 'AAPL', allocationPct: 100, prices: linearPrices('2025-01-01', '2025-12-31', 100, 200) }],
      0,
    );
    expect(r.finalValueNative).toBe(0);
  });

  it('U-BKT-015: 50/50 split equals avg of individual lump sums', () => {
    const aaplPrices = linearPrices('2025-01-01', '2025-12-31', 100, 200); // 2x
    const msftPrices = linearPrices('2025-01-01', '2025-12-31', 100, 150); // 1.5x

    const portfolio = backtestLumpSumPortfolio(
      [
        { symbol: 'AAPL', allocationPct: 50, prices: aaplPrices },
        { symbol: 'MSFT', allocationPct: 50, prices: msftPrices },
      ],
      1000,
    );

    // AAPL gets $500 → grows to $1000
    // MSFT gets $500 → grows to $750
    // Total: $1750
    expect(portfolio.finalValueNative).toBeCloseTo(1750, 0);
    expect(portfolio.contributedNative).toBe(1000);
    expect(portfolio.gainNative).toBeCloseTo(750, 0);
  });

  it('U-BKT-017: legs with empty prices are filtered out (no crash)', () => {
    const r = backtestLumpSumPortfolio(
      [
        { symbol: 'AAPL', allocationPct: 50, prices: linearPrices('2025-01-01', '2025-06-30', 100, 200) },
        { symbol: 'BROKEN', allocationPct: 50, prices: [] },
      ],
      1000,
    );
    // Only AAPL contributed; BROKEN was dropped
    expect(r.points.length).toBeGreaterThan(0);
    expect(r.finalValueNative).toBeGreaterThan(0);
  });

  it('U-BKT-018: timeline is the union of all leg dates', () => {
    // Different date ranges per leg — union should cover both
    const r = backtestLumpSumPortfolio(
      [
        { symbol: 'A', allocationPct: 50, prices: linearPrices('2025-01-01', '2025-06-30', 100, 200) },
        { symbol: 'B', allocationPct: 50, prices: linearPrices('2025-03-01', '2025-12-31', 100, 200) },
      ],
      1000,
    );
    // Union covers Jan 1 through Dec 31
    expect(r.points[0].timestamp.slice(0, 10)).toBe('2025-01-01');
    expect(r.points[r.points.length - 1].timestamp.slice(0, 10)).toBe('2025-12-31');
  });

  it('U-BKT-016: missing dates per leg are forward-filled from last known value', () => {
    // Leg A stops contributing data in June; leg B continues through Dec.
    // After June, A's value should be held constant (forward-filled), not drop to 0.
    const r = backtestLumpSumPortfolio(
      [
        { symbol: 'A', allocationPct: 50, prices: linearPrices('2025-01-01', '2025-06-30', 100, 100) },
        { symbol: 'B', allocationPct: 50, prices: linearPrices('2025-01-01', '2025-12-31', 100, 100) },
      ],
      1000,
    );
    // After June 30, A is forward-filled at $500 and B continues at $500 → total stays ~$1000
    const dec = r.points[r.points.length - 1];
    expect(dec.valueNative).toBeCloseTo(1000, 0);
  });
});
