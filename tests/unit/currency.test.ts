import { describe, expect, it } from 'vitest';

import {
  FxUnavailableError,
  assertFxAvailable,
  fromCad,
  getFxRateOrNull,
  toCad,
} from '@/lib/currency';

describe('toCad', () => {
  it('CAD passes through unchanged', () => {
    expect(toCad(100, 'CAD', 1.5)).toBe(100);
    expect(toCad(100, 'CAD', null)).toBe(100);
  });
  it('USD multiplies by rate', () => {
    expect(toCad(100, 'USD', 1.37)).toBeCloseTo(137, 5);
  });
  it('throws on USD with null rate', () => {
    expect(() => toCad(100, 'USD', null)).toThrow(FxUnavailableError);
  });
});

describe('fromCad', () => {
  it('USD divides by rate', () => {
    expect(fromCad(137, 'USD', 1.37)).toBeCloseTo(100, 5);
  });
});

describe('assertFxAvailable', () => {
  it('CAD always passes', () => {
    expect(() => assertFxAvailable('CAD', null)).not.toThrow();
  });
  it('throws on null/NaN/≤0 for non-CAD', () => {
    expect(() => assertFxAvailable('USD', null)).toThrow();
    expect(() => assertFxAvailable('USD', NaN)).toThrow();
    expect(() => assertFxAvailable('USD', 0)).toThrow();
    expect(() => assertFxAvailable('USD', -1)).toThrow();
  });
});

describe('getFxRateOrNull', () => {
  it('returns 1 for CAD', () => {
    expect(getFxRateOrNull('CAD', null)).toBe(1);
  });
  it('returns rate when valid', () => {
    expect(getFxRateOrNull('USD', 1.37)).toBe(1.37);
  });
  it('returns null when invalid', () => {
    expect(getFxRateOrNull('USD', null)).toBe(null);
    expect(getFxRateOrNull('USD', 0)).toBe(null);
  });
});
