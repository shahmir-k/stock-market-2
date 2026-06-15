// MarketDataProvider interface (PRD §14.3) and provider selection.
//
// Two implementations: TwelveDataProvider (calls internal /api/market/*
// routes; selected when mode === 'API') and the mock provider (always
// available for offline/demo use, selected when mode === 'MOCK').

import type {
  AssetSearchResult,
  FxResponseData,
  HistoricalPricePoint,
  HistoricalQuoteResponseData,
  HistoryRangeResponseData,
  ProfileResponseData,
  QuoteResponseData,
} from '@/types/market';
import type { MarketDataMode } from '@/types/portfolio';

import { mockMarketDataProvider } from './mock/mockProvider';
import { twelveDataProvider } from './twelveDataProvider';

export interface MarketDataProvider {
  searchSymbols(query: string): Promise<AssetSearchResult[]>;
  getQuote(symbol: string): Promise<QuoteResponseData | null>;
  getQuotes(symbols: string[]): Promise<QuoteResponseData[]>;
  getHistoricalPrices(
    symbol: string,
    outputsize?: number,
  ): Promise<HistoricalPricePoint[] | null>;
  getExchangeRate(
    from: string,
    to: string,
  ): Promise<FxResponseData | null>;
  getProfile(symbol: string): Promise<ProfileResponseData | null>;
  // Time-travel: historical price + FX + range queries.
  getHistoricalQuoteAt(
    symbol: string,
    date: string,
  ): Promise<HistoricalQuoteResponseData | null>;
  getHistoricalExchangeRate(
    from: string,
    to: string,
    date: string,
  ): Promise<FxResponseData | null>;
  getHistoryRange(symbol: string): Promise<HistoryRangeResponseData | null>;
}

export function getProvider(mode: MarketDataMode): MarketDataProvider {
  return mode === 'API' ? twelveDataProvider : mockMarketDataProvider;
}
