import { describe, expect, it } from 'vitest';

import { calculateCompound } from '@/lib/compound';

describe('calculateCompound', () => {
  it('PRD §28.5 example: 0 start, 200/mo, 7%, 40y → ~525,000', () => {
    const r = calculateCompound({
      startingAmount: 0,
      monthlyContribution: 200,
      annualReturnPercent: 7,
      years: 40,
    });
    expect(r.futureValueCad).toBeGreaterThan(520_000);
    expect(r.futureValueCad).toBeLessThan(530_000);
  });

  it('handles r=0 without divide-by-zero', () => {
    const r = calculateCompound({
      startingAmount: 0,
      monthlyContribution: 200,
      annualReturnPercent: 0,
      years: 10,
    });
    expect(r.futureValueCad).toBe(24_000);
    expect(r.totalContributedCad).toBe(24_000);
    expect(r.growthCad).toBe(0);
  });

  it('produces a yearly point per year + initial', () => {
    const r = calculateCompound({
      startingAmount: 1000,
      monthlyContribution: 0,
      annualReturnPercent: 10,
      years: 5,
    });
    expect(r.yearlyPoints.length).toBe(6);
    expect(r.yearlyPoints[0].year).toBe(0);
    expect(r.yearlyPoints[5].year).toBe(5);
  });
});
