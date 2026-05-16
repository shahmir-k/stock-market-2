import { describe, expect, it } from 'vitest';

import { realizedGainLossOnSell } from '@/lib/calculations/realizedGainLoss';

describe('realizedGainLossOnSell', () => {
  it('positive when sell > avg', () => {
    expect(realizedGainLossOnSell(1, 130, 110)).toBe(20);
  });

  it('negative when sell < avg', () => {
    expect(realizedGainLossOnSell(2, 90, 100)).toBe(-20);
  });

  it('zero when sell == avg', () => {
    expect(realizedGainLossOnSell(5, 50, 50)).toBe(0);
  });

  it('throws on non-positive quantity', () => {
    expect(() => realizedGainLossOnSell(0, 100, 80)).toThrow();
  });

  it('U-RGL-005: PRD §24.5 example qty=1, sell=130, avg=110 → +20', () => {
    expect(realizedGainLossOnSell(1, 130, 110)).toBe(20);
  });

  it('U-RGL-006: fractional qty scales proportionally', () => {
    expect(realizedGainLossOnSell(0.5, 130, 110)).toBe(10);
  });

  it('throws on negative quantity', () => {
    expect(() => realizedGainLossOnSell(-1, 100, 80)).toThrow();
  });
});
