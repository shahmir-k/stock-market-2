// Twelve Data response → app contract normalization (PRD §18.2 + §26).
//
// Filters out unsupported asset types, exchanges, and currencies so the UI
// only ever sees stocks/ETFs on NASDAQ/NYSE/NYSE ARCA/TSX in CAD/USD.

import type {
  AssetSearchResult,
  AssetType,
  Currency,
  Exchange,
  HistoricalPricePoint,
  ProfileResponseData,
  QuoteResponseData,
} from '@/types/market';

import { computeFreshness } from '../api/freshness';

// ----- Twelve Data raw shapes (only the fields we read) --------------------

export type TdSearchResult = {
  symbol: string;
  instrument_name: string;
  exchange: string;
  mic_code?: string;
  instrument_type: string;
  country?: string;
  currency: string;
};

export type TdSearchResponse = {
  data: TdSearchResult[];
  status?: string;
};

export type TdQuote = {
  symbol: string;
  name: string;
  exchange: string;
  mic_code?: string;
  currency: string;
  datetime?: string;
  timestamp?: number;
  open?: string;
  high?: string;
  low?: string;
  close: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  volume?: string;
  type?: string;
};

export type TdHistoryValue = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

export type TdHistoryResponse = {
  meta?: { symbol?: string; interval?: string };
  values?: TdHistoryValue[];
  status?: string;
};

export type TdExchangeRate = {
  symbol: string;
  rate: number;
  timestamp?: number;
};

export type TdProfile = {
  symbol?: string;
  sector?: string;
  industry?: string;
  website?: string;
};

// ----- Mappings ------------------------------------------------------------

const EXCHANGE_MAP: Record<string, Exchange> = {
  NASDAQ: 'NASDAQ',
  NYSE: 'NYSE',
  'NYSE ARCA': 'NYSE ARCA',
  ARCA: 'NYSE ARCA',
  'NYSE Arca': 'NYSE ARCA',
  TSX: 'TSX',
  'Toronto Stock Exchange': 'TSX',
};

function mapExchange(raw: string): Exchange | null {
  return EXCHANGE_MAP[raw] ?? null;
}

function mapCurrency(raw: string): Currency | null {
  if (raw === 'CAD' || raw === 'USD') return raw;
  return null;
}

function mapAssetType(raw: string): AssetType | null {
  const v = raw.toLowerCase();
  if (v.includes('etf') || v.includes('exchange-traded') || v.includes('exchange traded')) {
    return 'ETF';
  }
  if (
    v.includes('common stock') ||
    v.includes('depositary receipt') ||
    v.includes('class') ||
    v === 'stock' ||
    v === 'common'
  ) {
    return 'STOCK';
  }
  return null;
}

// ----- Search --------------------------------------------------------------

export function normalizeSearch(raw: TdSearchResponse): AssetSearchResult[] {
  const items = raw.data ?? [];
  const out: AssetSearchResult[] = [];
  // Dedupe by (symbol, exchange, currency) — Twelve Data sometimes returns the
  // same listing twice (different mic_code records that map to the same
  // exchange). Dual-listings (AAPL/NASDAQ/USD vs AAPL/TSX/CAD) stay distinct.
  const seen = new Set<string>();
  for (const item of items) {
    const exchange = mapExchange(item.exchange);
    const currency = mapCurrency(item.currency);
    const assetType = mapAssetType(item.instrument_type);
    if (!exchange || !currency || !assetType) {
      continue;
    }
    const dedupKey = `${item.symbol}|${exchange}|${currency}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    out.push({
      symbol: item.symbol,
      name: item.instrument_name,
      assetType,
      exchange,
      currency,
      country: item.country,
      micCode: item.mic_code,
      isSupported: true,
    });
  }
  return out;
}

// ----- Quote ---------------------------------------------------------------

function num(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeQuote(raw: TdQuote): QuoteResponseData | null {
  const exchange = mapExchange(raw.exchange);
  const currency = mapCurrency(raw.currency);
  if (!exchange || !currency) return null;

  const assetType =
    mapAssetType(raw.type ?? '') ?? 'STOCK'; // default; quote endpoint sometimes omits

  const closeNum = num(raw.close);
  if (closeNum === undefined || closeNum <= 0) return null;

  const ts = raw.timestamp
    ? new Date(raw.timestamp * 1000).toISOString()
    : raw.datetime
      ? new Date(raw.datetime).toISOString()
      : new Date().toISOString();

  return {
    symbol: raw.symbol,
    name: raw.name,
    assetType,
    exchange,
    currency,
    priceNative: closeNum,
    changeNative: num(raw.change),
    changePercent: num(raw.percent_change),
    previousCloseNative: num(raw.previous_close),
    openNative: num(raw.open),
    highNative: num(raw.high),
    lowNative: num(raw.low),
    volume: num(raw.volume),
    quoteTimestamp: ts,
    freshness: computeFreshness(ts),
  };
}

// ----- History -------------------------------------------------------------

export function normalizeHistory(
  raw: TdHistoryResponse,
): HistoricalPricePoint[] {
  const values = raw.values ?? [];
  const points: HistoricalPricePoint[] = [];
  for (const v of values) {
    const close = num(v.close);
    const open = num(v.open);
    const high = num(v.high);
    const low = num(v.low);
    if (
      close === undefined ||
      open === undefined ||
      high === undefined ||
      low === undefined
    ) {
      continue;
    }
    points.push({
      timestamp: new Date(v.datetime).toISOString(),
      openNative: open,
      highNative: high,
      lowNative: low,
      closeNative: close,
      volume: num(v.volume),
    });
  }
  // Twelve Data returns newest-first; we want chronological.
  return points.reverse();
}

// ----- Profile -------------------------------------------------------------

export function normalizeProfile(
  symbol: string,
  raw: TdProfile,
): ProfileResponseData {
  return {
    symbol: raw.symbol ?? symbol,
    sector: raw.sector || undefined,
    industry: raw.industry || undefined,
    website: raw.website || undefined,
  };
}
