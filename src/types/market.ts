// Market data + API contract types per PRD §26.
// All internal /api/market/* routes return one of the envelope shapes below;
// frontend code must handle both `ok: true` and `ok: false` branches.

export type AssetType = 'STOCK' | 'ETF';
export type Exchange = 'NASDAQ' | 'NYSE' | 'NYSE ARCA' | 'TSX';
export type Currency = 'CAD' | 'USD';
export type Freshness = 'FRESH' | 'RECENT' | 'STALE' | 'UNAVAILABLE';

// PRD §26.5 — normalized error codes returned by internal API routes.
export type ApiErrorCode =
  | 'MISSING_QUERY'
  | 'INVALID_SYMBOL'
  | 'UNSUPPORTED_ASSET'
  | 'UNSUPPORTED_EXCHANGE'
  | 'UNSUPPORTED_CURRENCY'
  | 'QUOTE_UNAVAILABLE'
  | 'HISTORY_UNAVAILABLE'
  | 'FX_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'TWELVE_DATA_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// PRD §26 envelope.
export type ApiSuccess<T> = {
  ok: true;
  data: T;
  cached?: boolean;
  fetchedAt: string;
};

export type ApiError = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
  fetchedAt: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// PRD §26.1 — search.
export type AssetSearchResult = {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: Exchange;
  currency: Currency;
  country?: string;
  micCode?: string;
  isSupported: boolean;
  unsupportedReason?: string;
};

export type SearchResponse = ApiResponse<AssetSearchResult[]>;

// PRD §26.2 — quote.
export type QuoteResponseData = {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: Exchange;
  currency: Currency;
  priceNative: number;
  changeNative?: number;
  changePercent?: number;
  previousCloseNative?: number;
  openNative?: number;
  highNative?: number;
  lowNative?: number;
  volume?: number;
  sector?: string;
  quoteTimestamp: string;
  freshness: Freshness;
};

export type QuoteResponse = ApiResponse<QuoteResponseData>;

// PRD §26.3 — historical prices.
export type HistoricalInterval = '1day';

export type HistoricalPricePoint = {
  timestamp: string;
  openNative: number;
  highNative: number;
  lowNative: number;
  closeNative: number;
  volume?: number;
};

export type HistoricalPriceResponseData = {
  symbol: string;
  interval: HistoricalInterval;
  points: HistoricalPricePoint[];
};

export type HistoricalPriceResponse = ApiResponse<HistoricalPriceResponseData>;

// Time-travel: single historical point flattened from /api/market/history?start_date=end_date=D.
// `actualDate` is the bar's date when markets were closed on the requested `date`.
export type HistoricalQuoteResponseData = {
  symbol: string;
  date: string;
  actualDate: string;
  closeNative: number;
  openNative: number;
  highNative: number;
  lowNative: number;
  currency: Currency;
};
export type HistoricalQuoteResponse = ApiResponse<HistoricalQuoteResponseData>;

// Time-travel: slider bounds derived once per asset.
export type HistoryRangeResponseData = {
  symbol: string;
  earliestDate: string;
  latestDate: string;
};
export type HistoryRangeResponse = ApiResponse<HistoryRangeResponseData>;

// PRD §26.4 — FX. `date` is populated when a historical date was requested.
export type FxResponseData = {
  from: 'USD' | 'CAD';
  to: 'CAD';
  rate: number;
  timestamp: string;
  date?: string;
  freshness: Freshness;
};

export type FxResponse = ApiResponse<FxResponseData>;

// Company profile (sector/industry). Used to backfill `holding.sector` since
// the quote endpoint doesn't always include it.
export type ProfileResponseData = {
  symbol: string;
  sector?: string;
  industry?: string;
  website?: string;
};

export type ProfileResponse = ApiResponse<ProfileResponseData>;
