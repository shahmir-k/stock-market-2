// Search normalization — regression for R-BUG-003 (Twelve Data sometimes
// returns the same listing twice with different mic_codes; we dedupe by
// (symbol, exchange, currency) so the UI never sees a key collision).

import { describe, expect, it } from 'vitest';

import {
  normalizeSearch,
  type TdSearchResponse,
} from '@/lib/market-data/twelveData/normalize';

function search(items: TdSearchResponse['data']): TdSearchResponse {
  return { data: items };
}

describe('normalizeSearch', () => {
  it('A-SRC-002: returns normalized result for a supported NASDAQ stock', () => {
    const r = normalizeSearch(
      search([
        {
          symbol: 'AAPL',
          instrument_name: 'Apple Inc.',
          exchange: 'NASDAQ',
          mic_code: 'XNAS',
          instrument_type: 'Common Stock',
          country: 'United States',
          currency: 'USD',
        },
      ]),
    );
    expect(r.length).toBe(1);
    expect(r[0]).toMatchObject({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'STOCK',
      exchange: 'NASDAQ',
      currency: 'USD',
      isSupported: true,
    });
  });

  it('A-SRC-003: filters out unsupported exchanges', () => {
    const r = normalizeSearch(
      search([
        {
          symbol: 'BMW',
          instrument_name: 'BMW AG',
          exchange: 'XETRA',
          instrument_type: 'Common Stock',
          currency: 'EUR',
        },
      ]),
    );
    expect(r).toEqual([]);
  });

  it('A-SRC-004: filters out unsupported currencies', () => {
    const r = normalizeSearch(
      search([
        {
          symbol: 'X',
          instrument_name: 'X',
          exchange: 'NASDAQ',
          instrument_type: 'Common Stock',
          currency: 'EUR',
        },
      ]),
    );
    expect(r).toEqual([]);
  });

  it('filters out unsupported asset types', () => {
    const r = normalizeSearch(
      search([
        {
          symbol: 'BTC/USD',
          instrument_name: 'Bitcoin',
          exchange: 'NASDAQ',
          instrument_type: 'Digital Currency',
          currency: 'USD',
        },
      ]),
    );
    expect(r).toEqual([]);
  });

  it('A-SRC-005 (R-BUG-003): dedupes identical entries by (symbol, exchange, currency)', () => {
    // Twelve Data returns AAPL/NASDAQ/USD twice — once per mic_code
    const r = normalizeSearch(
      search([
        {
          symbol: 'AAPL',
          instrument_name: 'Apple Inc.',
          exchange: 'NASDAQ',
          mic_code: 'XNAS',
          instrument_type: 'Common Stock',
          currency: 'USD',
        },
        {
          symbol: 'AAPL',
          instrument_name: 'Apple Inc.',
          exchange: 'NASDAQ',
          mic_code: 'BATS', // different mic, same listing
          instrument_type: 'Common Stock',
          currency: 'USD',
        },
      ]),
    );
    expect(r.length).toBe(1); // deduped
  });

  it('preserves dual-listings (same symbol, different exchange/currency)', () => {
    const r = normalizeSearch(
      search([
        {
          symbol: 'AAPL',
          instrument_name: 'Apple Inc.',
          exchange: 'NASDAQ',
          instrument_type: 'Common Stock',
          currency: 'USD',
        },
        {
          symbol: 'AAPL',
          instrument_name: 'Apple Inc.',
          exchange: 'TSX',
          instrument_type: 'Common Stock',
          currency: 'CAD',
        },
      ]),
    );
    expect(r.length).toBe(2); // both listings kept
  });

  it('maps ETF instrument types correctly', () => {
    const r = normalizeSearch(
      search([
        {
          symbol: 'SPY',
          instrument_name: 'SPDR S&P 500 ETF',
          exchange: 'NYSE ARCA',
          instrument_type: 'Exchange-Traded Fund',
          currency: 'USD',
        },
      ]),
    );
    expect(r[0]?.assetType).toBe('ETF');
  });

  it('handles empty input gracefully', () => {
    expect(normalizeSearch({ data: [] })).toEqual([]);
    expect(normalizeSearch({} as TdSearchResponse)).toEqual([]);
  });
});
