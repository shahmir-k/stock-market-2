import { describe, expect, it } from 'vitest';

import {
  ASSET_BY_SYMBOL,
  mockHistory,
  mockHistoricalFx,
  mockHistoricalQuote,
  mockHistoryRange,
} from '@/lib/market-data/mock/mockAssets';

describe('mockHistory', () => {
  it('returns the default 30 most-recent points when no range is given', () => {
    const out = mockHistory('AAPL');
    expect(out).not.toBeNull();
    expect(out!.length).toBe(30);
    // Chronological order
    for (let i = 1; i < out!.length; i += 1) {
      expect(out![i].timestamp >= out![i - 1].timestamp).toBe(true);
    }
  });

  it('returns ≥ 2,500 points for a 10-year date range', () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tenYearsAgo = new Date(today);
    tenYearsAgo.setUTCFullYear(today.getUTCFullYear() - 10);
    const out = mockHistory('AAPL', undefined, {
      startDate: tenYearsAgo.toISOString().slice(0, 10),
      endDate: today.toISOString().slice(0, 10),
    });
    expect(out).not.toBeNull();
    expect(out!.length).toBeGreaterThanOrEqual(2500);
  });

  it('filters bounded by startDate and endDate inclusively', () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - 100);
    const end = new Date(today);
    end.setUTCDate(today.getUTCDate() - 50);
    const out = mockHistory('AAPL', undefined, {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
    expect(out!.length).toBe(51);
    expect(out![0].timestamp.slice(0, 10)).toBe(start.toISOString().slice(0, 10));
    expect(out![out!.length - 1].timestamp.slice(0, 10)).toBe(
      end.toISOString().slice(0, 10),
    );
  });

  it('is deterministic across calls', () => {
    const a = mockHistory('AAPL', 10);
    const b = mockHistory('AAPL', 10);
    expect(a).toEqual(b);
  });

  it('returns null for unknown symbol', () => {
    expect(mockHistory('NOPE')).toBeNull();
  });
});

describe('mockHistoricalQuote', () => {
  it('returns most-recent bar ≤ requested date', () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const target = new Date(today);
    target.setUTCDate(today.getUTCDate() - 365);
    const date = target.toISOString().slice(0, 10);
    const q = mockHistoricalQuote('AAPL', date);
    expect(q).not.toBeNull();
    expect(q!.actualDate <= date).toBe(true);
    expect(q!.symbol).toBe('AAPL');
    expect(q!.currency).toBe(ASSET_BY_SYMBOL.get('AAPL')!.currency);
    expect(q!.closeNative).toBeGreaterThan(0);
  });

  it('falls back to the most recent prior bar for an unknown future date', () => {
    const q = mockHistoricalQuote('AAPL', '2050-01-01');
    expect(q).not.toBeNull();
    expect(q!.actualDate).toBeDefined();
  });

  it('returns null for unknown symbol', () => {
    expect(mockHistoricalQuote('NOPE', '2020-01-02')).toBeNull();
  });
});

describe('mockHistoricalFx', () => {
  it('returns rate 1 for CAD→CAD', () => {
    const fx = mockHistoricalFx('CAD', 'CAD', '2020-01-02');
    expect(fx).not.toBeNull();
    expect(fx!.rate).toBe(1);
    expect(fx!.date).toBe('2020-01-02');
  });

  it('deterministic per (from, to, date) for USD→CAD', () => {
    const a = mockHistoricalFx('USD', 'CAD', '2020-01-02');
    const b = mockHistoricalFx('USD', 'CAD', '2020-01-02');
    expect(a!.rate).toBe(b!.rate);
  });

  it('returns null for unsupported destination', () => {
    expect(mockHistoricalFx('USD', 'EUR', '2020-01-02')).toBeNull();
  });
});

describe('mockHistoryRange', () => {
  it('returns earliestDate ≈ today-10y and latestDate = today', () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);
    const tenYearsAgo = new Date(today);
    tenYearsAgo.setUTCFullYear(today.getUTCFullYear() - 10);
    const range = mockHistoryRange('AAPL');
    expect(range).not.toBeNull();
    expect(range!.latestDate).toBe(todayIso);
    // earliestDate is roughly 10 years ago (3,652 days back) — allow ±3 days
    const diffMs =
      Math.abs(
        new Date(range!.earliestDate).getTime() - tenYearsAgo.getTime(),
      );
    expect(diffMs).toBeLessThan(4 * 24 * 60 * 60 * 1000);
  });

  it('returns null for unknown symbol', () => {
    expect(mockHistoryRange('NOPE')).toBeNull();
  });
});
