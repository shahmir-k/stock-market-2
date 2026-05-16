import { describe, expect, it } from 'vitest';

import {
  calculateDiversification,
  diversificationLabel,
} from '@/lib/diversification';
import type { Holding } from '@/types/portfolio';

const h = (overrides: Partial<Holding> = {}): Holding => ({
  symbol: 'AAPL',
  assetName: 'Apple',
  assetType: 'STOCK',
  exchange: 'NASDAQ',
  sector: 'Technology',
  quantity: 10,
  averageCostCad: 100,
  currentPriceNative: 100,
  currentPriceCad: 100,
  nativeCurrency: 'CAD',
  fxRateToCad: 1,
  lastQuoteAt: '2026-05-15T00:00:00Z',
  ...overrides,
});

describe('diversificationLabel', () => {
  it('maps score bands to labels', () => {
    expect(diversificationLabel(100)).toBe('Strong diversification');
    expect(diversificationLabel(70)).toBe('Good diversification');
    expect(diversificationLabel(50)).toBe('Moderate concentration');
    expect(diversificationLabel(30)).toBe('High concentration risk');
    expect(diversificationLabel(0)).toBe('Very high concentration risk');
  });
});

describe('calculateDiversification', () => {
  it('penalizes single-holding portfolios', () => {
    const r = calculateDiversification(0, [h({ quantity: 50 })]);
    // 100 - 30 (>60% in one holding) - 15 (<3 holdings) - 10 (<2 sectors) - 10 (<1% cash) = 35
    expect(r.score).toBeLessThanOrEqual(40);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('rewards diversified portfolio with broad ETF', () => {
    const r = calculateDiversification(100, [
      h({ symbol: 'A', sector: 'Tech', quantity: 5, currentPriceCad: 100 }),
      h({ symbol: 'B', sector: 'Health', quantity: 5, currentPriceCad: 100 }),
      h({ symbol: 'C', sector: 'Finance', quantity: 5, currentPriceCad: 100 }),
      h({ symbol: 'D', sector: 'Energy', quantity: 5, currentPriceCad: 100 }),
      h({
        symbol: 'VFV',
        sector: 'Diversified',
        assetType: 'ETF',
        quantity: 5,
        currentPriceCad: 100,
      }),
    ]);
    // Should be high — 5 holdings (+5), 5 sectors (+5), broad ETF (+5)
    expect(r.score).toBeGreaterThanOrEqual(85);
  });
});
