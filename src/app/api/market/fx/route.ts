import { NextRequest } from 'next/server';

import { apiError, apiOk } from '@/lib/market-data/api/envelope';
import { computeFreshness } from '@/lib/market-data/api/freshness';
import { CACHE_TTL, getCached, setCached } from '@/lib/market-data/cache';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';
import {
  normalizeHistory,
  type TdExchangeRate,
  type TdHistoryResponse,
} from '@/lib/market-data/twelveData/normalize';
import type { FxResponseData } from '@/types/market';

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from')?.trim().toUpperCase();
  const to = req.nextUrl.searchParams.get('to')?.trim().toUpperCase();
  const date = req.nextUrl.searchParams.get('date')?.trim();

  if (!from || !to) {
    return apiError('MISSING_QUERY', 'Missing from/to currency parameters.');
  }
  if (to !== 'CAD') {
    return apiError(
      'UNSUPPORTED_CURRENCY',
      'Only CAD is supported as the destination currency.',
    );
  }
  if (from !== 'USD' && from !== 'CAD') {
    return apiError(
      'UNSUPPORTED_CURRENCY',
      'Only USD or CAD are supported as the source currency.',
    );
  }

  // CAD → CAD short-circuits per PRD §26.4 (date is irrelevant since rate is 1).
  if (from === 'CAD') {
    const data: FxResponseData = {
      from: 'CAD',
      to: 'CAD',
      rate: 1,
      timestamp: new Date().toISOString(),
      ...(date ? { date } : {}),
      freshness: 'FRESH',
    };
    return apiOk(data);
  }

  // Time-travel: historical USD/CAD rate for a given trading day.
  if (date) {
    const cacheKey = `fx:${from}:${to}:${date}`;
    const cached = getCached<FxResponseData>(cacheKey);
    if (cached) {
      return apiOk(cached, { cached: true });
    }

    const result = await twelveDataFetch<TdHistoryResponse>('time_series', {
      symbol: `${from}/${to}`,
      interval: '1day',
      start_date: date,
      end_date: date,
      outputsize: 5,
    });
    if (!result.ok) {
      return apiError(result.code, result.message, result.details);
    }
    const points = normalizeHistory(result.data);
    if (points.length === 0) {
      return apiError('FX_UNAVAILABLE', 'No FX rate available for that date.');
    }
    const point = points[points.length - 1];
    const data: FxResponseData = {
      from: 'USD',
      to: 'CAD',
      rate: point.closeNative,
      timestamp: point.timestamp,
      date: point.timestamp.slice(0, 10),
      freshness: 'FRESH',
    };
    setCached(cacheKey, data, CACHE_TTL.FX_HISTORICAL_MS);
    return apiOk(data);
  }

  const cacheKey = `fx:${from}:${to}`;
  const cached = getCached<FxResponseData>(cacheKey);
  if (cached) {
    return apiOk(cached, { cached: true });
  }

  const result = await twelveDataFetch<TdExchangeRate>('exchange_rate', {
    symbol: `${from}/${to}`,
  });
  if (!result.ok) {
    return apiError(result.code, result.message, result.details);
  }
  if (!result.data.rate || !Number.isFinite(result.data.rate)) {
    return apiError('FX_UNAVAILABLE', 'FX rate unavailable.');
  }

  const ts = result.data.timestamp
    ? new Date(result.data.timestamp * 1000).toISOString()
    : new Date().toISOString();

  const data: FxResponseData = {
    from: 'USD',
    to: 'CAD',
    rate: result.data.rate,
    timestamp: ts,
    freshness: computeFreshness(ts),
  };
  setCached(cacheKey, data, CACHE_TTL.FX_MS);
  return apiOk(data);
}
