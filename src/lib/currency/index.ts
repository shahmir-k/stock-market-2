// Currency conversion helpers per PRD §18.3.
//
// Conversion rules:
//   - CAD assets: fxRateToCad = 1 (no-op, no external call needed)
//   - USD assets: use USD→CAD rate from /api/market/fx
//   - If FX is unavailable AND no cached rate exists: non-CAD trades blocked
//
// These helpers do not fetch — they accept the rate as a parameter. Fetch +
// caching lives in the market-data module.

// `null` means the caller asked for a rate but none is currently available
// (network down, rate-limit, never fetched). Treat as "blocked" for non-CAD.
export type FxRate = number | null;

// PRD §18.3 — native price → CAD.
// CAD passes through unchanged; USD uses the provided rate.
export function toCad(
  priceNative: number,
  currency: 'CAD' | 'USD' | string,
  fxRate: FxRate,
): number {
  if (currency === 'CAD') {
    return priceNative;
  }
  assertFxAvailable(currency, fxRate);
  return priceNative * (fxRate as number);
}

// Inverse direction — used when displaying CAD costs in the native currency.
// (Useful for the asset detail screen where price is shown in native.)
export function fromCad(
  amountCad: number,
  currency: 'CAD' | 'USD' | string,
  fxRate: FxRate,
): number {
  if (currency === 'CAD') {
    return amountCad;
  }
  assertFxAvailable(currency, fxRate);
  return amountCad / (fxRate as number);
}

// Throws when the caller is about to use FX for a non-CAD currency but the
// rate is missing/invalid. The trade module catches this to surface a
// beginner-friendly "currency conversion unavailable" message (PRD §30.5).
export function assertFxAvailable(
  currency: string,
  fxRate: FxRate,
): asserts fxRate is number {
  if (currency === 'CAD') {
    // CAD never requires an external FX rate. Treat as always available.
    return;
  }
  if (fxRate === null || !Number.isFinite(fxRate) || fxRate <= 0) {
    throw new FxUnavailableError(
      `Currency conversion is unavailable for ${currency}.`,
    );
  }
}

// Convenience: returns a usable rate without throwing. CAD always returns 1.
// Non-CAD with missing rate returns `null` so the caller decides whether to
// block the action or fall back to cached state.
export function getFxRateOrNull(
  currency: 'CAD' | 'USD' | string,
  fxRate: FxRate,
): FxRate {
  if (currency === 'CAD') return 1;
  if (fxRate === null || !Number.isFinite(fxRate) || fxRate <= 0) return null;
  return fxRate;
}

export class FxUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FxUnavailableError';
  }
}
