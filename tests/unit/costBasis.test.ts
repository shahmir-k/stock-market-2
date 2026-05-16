import { describe, expect, it } from 'vitest';

import {
  HOLDING_CLOSE_EPSILON,
  costBasis,
  isHoldingClosed,
  recalcAverageCost,
} from '@/lib/calculations/costBasis';

describe('recalcAverageCost', () => {
  it('returns add price when oldQty=0 (first purchase)', () => {
    expect(recalcAverageCost(0, 0, 1, 100)).toBe(100);
  });

  it('matches PRD §28.2 example: buy 1@100 then 1@120 → avg 110', () => {
    expect(recalcAverageCost(1, 100, 1, 120)).toBe(110);
  });

  it('weighted average across uneven quantities', () => {
    expect(recalcAverageCost(2, 100, 1, 130)).toBeCloseTo(110, 5);
  });

  it('throws when addQuantity ≤ 0', () => {
    expect(() => recalcAverageCost(1, 100, 0, 50)).toThrow();
    expect(() => recalcAverageCost(1, 100, -1, 50)).toThrow();
  });
});

describe('costBasis', () => {
  it('quantity × averageCost', () => {
    expect(costBasis(3, 50)).toBe(150);
  });
});

describe('isHoldingClosed', () => {
  it('treats remaining ≤ epsilon as closed', () => {
    expect(isHoldingClosed(0)).toBe(true);
    expect(isHoldingClosed(HOLDING_CLOSE_EPSILON)).toBe(true);
    expect(isHoldingClosed(0.0001)).toBe(false);
  });
});
