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
});
