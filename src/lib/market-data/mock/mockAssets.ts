// Mock market data fixtures for development, testing, and the Mock data mode.
// Covers all 4 supported exchanges (NASDAQ/NYSE/NYSE ARCA/TSX), both
// supported currencies (USD/CAD), stocks + ETFs, and 6 sectors.
//
// Historical points are generated procedurally from a per-symbol seeded PRNG
// so output is stable across calls (good for snapshot tests) without needing
// to hand-author 16 × 30 OHLC rows.

import type {
  AssetSearchResult,
  AssetType,
  Currency,
  Exchange,
  FxResponseData,
  HistoricalPricePoint,
  QuoteResponseData,
} from '@/types/market';

export type MockAsset = {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: Exchange;
  currency: Currency;
  country: string;
  micCode: string;
  sector: string;
  basePrice: number;
  changePercent: number;
};

export const MOCK_ASSETS: MockAsset[] = [
  { symbol: 'AAPL',    name: 'Apple Inc.',                            assetType: 'STOCK', exchange: 'NASDAQ',    currency: 'USD', country: 'United States', micCode: 'XNAS', sector: 'Technology',             basePrice: 212.44, changePercent:  1.24 },
  { symbol: 'MSFT',    name: 'Microsoft Corporation',                 assetType: 'STOCK', exchange: 'NASDAQ',    currency: 'USD', country: 'United States', micCode: 'XNAS', sector: 'Technology',             basePrice: 432.15, changePercent:  0.45 },
  { symbol: 'GOOGL',   name: 'Alphabet Inc. Class A',                 assetType: 'STOCK', exchange: 'NASDAQ',    currency: 'USD', country: 'United States', micCode: 'XNAS', sector: 'Communication Services', basePrice: 173.20, changePercent: -0.32 },
  { symbol: 'NVDA',    name: 'NVIDIA Corporation',                    assetType: 'STOCK', exchange: 'NASDAQ',    currency: 'USD', country: 'United States', micCode: 'XNAS', sector: 'Technology',             basePrice: 138.66, changePercent:  2.18 },
  { symbol: 'AMZN',    name: 'Amazon.com Inc.',                       assetType: 'STOCK', exchange: 'NASDAQ',    currency: 'USD', country: 'United States', micCode: 'XNAS', sector: 'Consumer Cyclical',      basePrice: 198.40, changePercent: -0.74 },
  { symbol: 'JPM',     name: 'JPMorgan Chase & Co.',                  assetType: 'STOCK', exchange: 'NYSE',      currency: 'USD', country: 'United States', micCode: 'XNYS', sector: 'Financial Services',     basePrice: 220.50, changePercent:  0.31 },
  { symbol: 'JNJ',     name: 'Johnson & Johnson',                     assetType: 'STOCK', exchange: 'NYSE',      currency: 'USD', country: 'United States', micCode: 'XNYS', sector: 'Healthcare',             basePrice: 159.10, changePercent: -0.12 },
  { symbol: 'KO',      name: 'The Coca-Cola Company',                 assetType: 'STOCK', exchange: 'NYSE',      currency: 'USD', country: 'United States', micCode: 'XNYS', sector: 'Consumer Defensive',     basePrice:  70.85, changePercent:  0.21 },
  { symbol: 'SPY',     name: 'SPDR S&P 500 ETF Trust',                assetType: 'ETF',   exchange: 'NYSE ARCA', currency: 'USD', country: 'United States', micCode: 'ARCX', sector: 'Diversified',            basePrice: 580.20, changePercent:  0.55 },
  { symbol: 'VTI',     name: 'Vanguard Total Stock Market ETF',       assetType: 'ETF',   exchange: 'NYSE ARCA', currency: 'USD', country: 'United States', micCode: 'ARCX', sector: 'Diversified',            basePrice: 286.10, changePercent:  0.48 },
  { symbol: 'QQQ',     name: 'Invesco QQQ Trust',                     assetType: 'ETF',   exchange: 'NASDAQ',    currency: 'USD', country: 'United States', micCode: 'XNAS', sector: 'Diversified',            basePrice: 502.80, changePercent:  0.93 },
  { symbol: 'TD.TO',   name: 'Toronto-Dominion Bank',                 assetType: 'STOCK', exchange: 'TSX',       currency: 'CAD', country: 'Canada',        micCode: 'XTSE', sector: 'Financial Services',     basePrice:  77.50, changePercent:  0.34 },
  { symbol: 'RY.TO',   name: 'Royal Bank of Canada',                  assetType: 'STOCK', exchange: 'TSX',       currency: 'CAD', country: 'Canada',        micCode: 'XTSE', sector: 'Financial Services',     basePrice: 175.00, changePercent: -0.18 },
  { symbol: 'SHOP.TO', name: 'Shopify Inc.',                          assetType: 'STOCK', exchange: 'TSX',       currency: 'CAD', country: 'Canada',        micCode: 'XTSE', sector: 'Technology',             basePrice: 145.30, changePercent:  1.75 },
  { symbol: 'VFV.TO',  name: 'Vanguard S&P 500 Index ETF',            assetType: 'ETF',   exchange: 'TSX',       currency: 'CAD', country: 'Canada',        micCode: 'XTSE', sector: 'Diversified',            basePrice: 132.40, changePercent:  0.51 },
  { symbol: 'XIU.TO',  name: 'iShares S&P/TSX 60 Index ETF',          assetType: 'ETF',   exchange: 'TSX',       currency: 'CAD', country: 'Canada',        micCode: 'XTSE', sector: 'Diversified',            basePrice:  38.20, changePercent:  0.27 },
];

// USD/CAD reference rate used by the mock provider. Matches the real-world
// range circa 2025–2026 so trade preview numbers feel realistic in mock mode.
export const MOCK_FX_USD_CAD = 1.37;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const ASSET_BY_SYMBOL: Map<string, MockAsset> = new Map(
  MOCK_ASSETS.map((a) => [a.symbol.toUpperCase(), a]),
);

function nowIso(): string {
  return new Date().toISOString();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Stable per-symbol PRNG so generated history doesn't drift between calls in
// the same browser/process. Mulberry32 is fine for fixture data — not crypto.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ---------------------------------------------------------------------------
// Fixture data builders — return shapes that match the API contract types so
// they can flow directly through the API envelope without further mapping.
// ---------------------------------------------------------------------------

export function mockSearch(query: string): AssetSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  return MOCK_ASSETS.filter(
    (a) =>
      a.symbol.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q),
  ).map((a) => ({
    symbol: a.symbol,
    name: a.name,
    assetType: a.assetType,
    exchange: a.exchange,
    currency: a.currency,
    country: a.country,
    micCode: a.micCode,
    isSupported: true,
  }));
}

export function mockQuote(symbol: string): QuoteResponseData | null {
  const asset = ASSET_BY_SYMBOL.get(symbol.toUpperCase());
  if (!asset) return null;

  const previousClose = round2(asset.basePrice / (1 + asset.changePercent / 100));
  const changeNative = round2(asset.basePrice - previousClose);
  const open = round2(previousClose * (1 + (asset.changePercent / 100) * 0.3));

  // Build a small intraday range around the base price.
  const high = round2(Math.max(open, asset.basePrice) * 1.005);
  const low = round2(Math.min(open, asset.basePrice) * 0.995);

  return {
    symbol: asset.symbol,
    name: asset.name,
    assetType: asset.assetType,
    exchange: asset.exchange,
    currency: asset.currency,
    priceNative: asset.basePrice,
    changeNative,
    changePercent: asset.changePercent,
    previousCloseNative: previousClose,
    openNative: open,
    highNative: high,
    lowNative: low,
    volume: 1_000_000 + (hashString(asset.symbol) % 9_000_000),
    sector: asset.sector,
    quoteTimestamp: nowIso(),
    freshness: 'FRESH',
  };
}

export function mockHistory(
  symbol: string,
  outputsize = 30,
): HistoricalPricePoint[] | null {
  const asset = ASSET_BY_SYMBOL.get(symbol.toUpperCase());
  if (!asset) return null;

  const rng = mulberry32(hashString(asset.symbol));
  const points: HistoricalPricePoint[] = [];

  // Walk price backward from today's basePrice with bounded daily noise so
  // the chart looks plausibly volatile without spiking to absurd values.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let price = asset.basePrice;
  for (let i = 0; i < outputsize; i += 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);

    const drift = (rng() - 0.5) * 0.04; // ±2% daily move
    const open = round2(price * (1 + (rng() - 0.5) * 0.01));
    const close = round2(price * (1 + drift));
    const high = round2(Math.max(open, close) * (1 + rng() * 0.01));
    const low = round2(Math.min(open, close) * (1 - rng() * 0.01));
    const volume = Math.round(1_000_000 + rng() * 5_000_000);

    points.push({
      timestamp: date.toISOString(),
      openNative: open,
      highNative: high,
      lowNative: low,
      closeNative: close,
      volume,
    });

    price = close;
  }

  // Chronological order (oldest → newest).
  return points.reverse();
}

export function mockFx(from: string, to: string): FxResponseData | null {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (t !== 'CAD') return null;
  if (f === 'CAD') {
    return {
      from: 'CAD',
      to: 'CAD',
      rate: 1,
      timestamp: nowIso(),
      freshness: 'FRESH',
    };
  }
  if (f === 'USD') {
    return {
      from: 'USD',
      to: 'CAD',
      rate: MOCK_FX_USD_CAD,
      timestamp: nowIso(),
      freshness: 'FRESH',
    };
  }
  return null;
}
