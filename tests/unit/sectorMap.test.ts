// Sector map fallback — regression for R-BUG-007 (Twelve Data /profile
// requires a paid plan, so we fall back to a hand-curated map for the
// common symbols and the rest report "Unknown" cleanly).

import { describe, expect, it } from 'vitest';

import { getKnownSector } from '@/lib/market-data/sectorMap';

describe('getKnownSector', () => {
  it('R-BUG-007: returns sector for common US tech symbols', () => {
    expect(getKnownSector('AAPL')).toBe('Technology');
    expect(getKnownSector('MSFT')).toBe('Technology');
    expect(getKnownSector('NVDA')).toBe('Technology');
  });

  it('returns sector for financials', () => {
    expect(getKnownSector('JPM')).toBe('Financial Services');
    expect(getKnownSector('V')).toBe('Financial Services');
  });

  it('returns sector for ETFs as "Diversified"', () => {
    expect(getKnownSector('SPY')).toBe('Diversified');
    expect(getKnownSector('VOO')).toBe('Diversified');
    expect(getKnownSector('VFV.TO')).toBe('Diversified');
  });

  it('handles Canadian listings (TSX suffix)', () => {
    expect(getKnownSector('RY.TO')).toBe('Financial Services');
    expect(getKnownSector('ENB.TO')).toBe('Energy');
    expect(getKnownSector('FTS.TO')).toBe('Utilities');
  });

  it('is case-insensitive', () => {
    expect(getKnownSector('aapl')).toBe('Technology');
    expect(getKnownSector('vfv.to')).toBe('Diversified');
  });

  it('returns undefined for unknown symbols (allowing UI to render "Unknown")', () => {
    expect(getKnownSector('NOT_A_SYMBOL_001')).toBeUndefined();
  });

  it('every known symbol returns a non-empty sector string', () => {
    // Pick a representative sample of every category
    const samples = [
      'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', // tech / comm
      'JPM', 'V', 'MA',                                 // financial
      'JNJ', 'PFE', 'LLY',                              // healthcare
      'KO', 'WMT', 'PG',                                // consumer
      'XOM', 'BA', 'CAT',                               // energy / industrials
      'SPY', 'VOO', 'QQQ',                              // US ETFs
      'RY.TO', 'TD.TO', 'CNQ.TO', 'BCE.TO', 'VFV.TO',   // Canadian
    ];
    for (const s of samples) {
      const sector = getKnownSector(s);
      expect(sector, `expected ${s} to have a sector`).toBeTruthy();
    }
  });
});
