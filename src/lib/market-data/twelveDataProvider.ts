// Frontend MarketDataProvider that talks to internal /api/market/* routes.
// The browser must NEVER call Twelve Data directly per PRD §14.2.

import type {
  ApiResponse,
  AssetSearchResult,
  FxResponseData,
  HistoricalPricePoint,
  HistoricalPriceResponseData,
  ProfileResponseData,
  QuoteResponseData,
} from '@/types/market';

async function call<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(path, { cache: 'no-store' });
  return (await res.json()) as ApiResponse<T>;
}

export const twelveDataProvider = {
  async searchSymbols(query: string): Promise<AssetSearchResult[]> {
    if (query.trim().length === 0) return [];
    const r = await call<AssetSearchResult[]>(
      `/api/market/search?q=${encodeURIComponent(query)}`,
    );
    return r.ok ? r.data : [];
  },

  async getQuote(symbol: string): Promise<QuoteResponseData | null> {
    const r = await call<QuoteResponseData>(
      `/api/market/quote?symbol=${encodeURIComponent(symbol)}`,
    );
    return r.ok ? r.data : null;
  },

  async getQuotes(symbols: string[]): Promise<QuoteResponseData[]> {
    const results = await Promise.all(symbols.map((s) => this.getQuote(s)));
    return results.filter((q): q is QuoteResponseData => q !== null);
  },

  async getHistoricalPrices(
    symbol: string,
    outputsize = 30,
  ): Promise<HistoricalPricePoint[] | null> {
    const r = await call<HistoricalPriceResponseData>(
      `/api/market/history?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=${outputsize}`,
    );
    return r.ok ? r.data.points : null;
  },

  async getExchangeRate(
    from: string,
    to: string,
  ): Promise<FxResponseData | null> {
    const r = await call<FxResponseData>(
      `/api/market/fx?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    return r.ok ? r.data : null;
  },

  async getProfile(symbol: string): Promise<ProfileResponseData | null> {
    const r = await call<ProfileResponseData>(
      `/api/market/profile?symbol=${encodeURIComponent(symbol)}`,
    );
    return r.ok ? r.data : null;
  },
};
