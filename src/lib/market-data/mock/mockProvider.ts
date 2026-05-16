// Thin object wrapper around the mock fixture builders.
// The full MarketDataProvider interface lands in T-040 — at that point this
// object is wrapped (or replaced) by a class implementing the formal
// interface and `searchSymbols`/`getQuote`/etc. method names.
//
// Until then, exporting plain async functions with the same signatures lets
// the trading + portfolio code call the mock layer without depending on a
// class hierarchy that doesn't exist yet.

import type {
  AssetSearchResult,
  FxResponseData,
  HistoricalPricePoint,
  ProfileResponseData,
  QuoteResponseData,
} from '@/types/market';
import {
  ASSET_BY_SYMBOL,
  mockFx,
  mockHistory,
  mockQuote,
  mockSearch,
} from './mockAssets';

export const mockMarketDataProvider = {
  async searchSymbols(query: string): Promise<AssetSearchResult[]> {
    return mockSearch(query);
  },

  async getQuote(symbol: string): Promise<QuoteResponseData | null> {
    return mockQuote(symbol);
  },

  async getQuotes(symbols: string[]): Promise<QuoteResponseData[]> {
    return symbols
      .map(mockQuote)
      .filter((q): q is QuoteResponseData => q !== null);
  },

  async getHistoricalPrices(
    symbol: string,
    outputsize = 30,
  ): Promise<HistoricalPricePoint[] | null> {
    return mockHistory(symbol, outputsize);
  },

  async getExchangeRate(
    from: string,
    to: string,
  ): Promise<FxResponseData | null> {
    return mockFx(from, to);
  },

  async getProfile(symbol: string): Promise<ProfileResponseData | null> {
    const asset = ASSET_BY_SYMBOL.get(symbol.toUpperCase());
    if (!asset) return null;
    return {
      symbol: asset.symbol,
      sector: asset.sector,
    };
  },
};

export type MockMarketDataProvider = typeof mockMarketDataProvider;
