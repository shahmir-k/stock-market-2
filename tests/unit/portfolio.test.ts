import { describe, expect, it } from 'vitest';

import {
  cashAllocationPercent,
  holdingAllocationPercent,
  holdingMarketValue,
  holdingUnrealizedGainLoss,
  holdingUnrealizedGainLossPercent,
  investedValueCad,
  portfolioValueCad,
  sectorBreakdownCad,
  totalReturnCad,
  totalReturnPercent,
  unrealizedGainLossTotalCad,
} from '@/lib/calculations/portfolio';
import type { Holding } from '@/types/portfolio';

const h = (overrides: Partial<Holding> = {}): Holding => ({
  symbol: 'AAPL',
  assetName: 'Apple',
  assetType: 'STOCK',
  exchange: 'NASDAQ',
  sector: 'Technology',
  quantity: 1,
  averageCostCad: 100,
  currentPriceNative: 110,
  currentPriceCad: 110,
  nativeCurrency: 'CAD',
  fxRateToCad: 1,
  lastQuoteAt: '2026-05-15T00:00:00Z',
  ...overrides,
});

describe('per-holding metrics', () => {
  it('marketValue = qty × current', () => {
    expect(holdingMarketValue(h({ quantity: 2, currentPriceCad: 110 }))).toBe(220);
  });
  it('unrealized G/L = market - costBasis', () => {
    expect(
      holdingUnrealizedGainLoss(h({ quantity: 2, averageCostCad: 100, currentPriceCad: 110 })),
    ).toBe(20);
  });
  it('unrealized G/L % = gain / cost × 100', () => {
    expect(
      holdingUnrealizedGainLossPercent(
        h({ quantity: 2, averageCostCad: 100, currentPriceCad: 110 }),
      ),
    ).toBe(10);
  });
  it('handles zero cost basis', () => {
    expect(holdingUnrealizedGainLossPercent(h({ averageCostCad: 0 }))).toBe(0);
  });
});

describe('aggregates', () => {
  it('investedValue sums holdings', () => {
    expect(
      investedValueCad([
        h({ quantity: 1, currentPriceCad: 100 }),
        h({ symbol: 'MSFT', quantity: 2, currentPriceCad: 50 }),
      ]),
    ).toBe(200);
  });

  it('portfolioValue = cash + invested', () => {
    expect(portfolioValueCad(500, [h({ currentPriceCad: 200 })])).toBe(700);
  });

  it('totalReturn matches PRD example: 5300 from 5000 → +300, 6%', () => {
    expect(totalReturnCad(5300, 5000)).toBe(300);
    expect(totalReturnPercent(5300, 5000)).toBeCloseTo(6, 5);
  });

  it('totalReturnPercent = 0 when starting balance = 0', () => {
    expect(totalReturnPercent(100, 0)).toBe(0);
  });

  it('unrealizedGainLossTotal sums all holdings', () => {
    expect(
      unrealizedGainLossTotalCad([
        h({ averageCostCad: 100, currentPriceCad: 110 }),
        h({ symbol: 'MSFT', averageCostCad: 50, currentPriceCad: 40 }),
      ]),
    ).toBe(0);
  });
});

describe('allocations', () => {
  it('holding alloc % of total', () => {
    expect(holdingAllocationPercent(h({ currentPriceCad: 100 }), 500)).toBe(20);
  });
  it('cash alloc %', () => {
    expect(cashAllocationPercent(200, 500)).toBe(40);
  });
  it('returns 0 when total = 0', () => {
    expect(holdingAllocationPercent(h(), 0)).toBe(0);
    expect(cashAllocationPercent(0, 0)).toBe(0);
  });
});

describe('sectorBreakdownCad', () => {
  it('groups by sector and uses Unknown for missing', () => {
    const out = sectorBreakdownCad([
      h({ sector: 'Technology', currentPriceCad: 100 }),
      h({ symbol: 'KO', sector: 'Consumer Defensive', currentPriceCad: 50 }),
      h({ symbol: 'XYZ', sector: undefined, currentPriceCad: 30 }),
    ]);
    expect(out['Technology']).toBe(100);
    expect(out['Consumer Defensive']).toBe(50);
    expect(out['Unknown']).toBe(30);
  });
});
