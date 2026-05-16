import { NextRequest } from 'next/server';

import { apiError, apiOk } from '@/lib/market-data/api/envelope';
import { computeFreshness } from '@/lib/market-data/api/freshness';
import { CACHE_TTL, getCached, setCached } from '@/lib/market-data/cache';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';
import type { TdExchangeRate } from '@/lib/market-data/twelveData/normalize';
import type { FxResponseData } from '@/types/market';

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from')?.trim().toUpperCase();
  const to = req.nextUrl.searchParams.get('to')?.trim().toUpperCase();

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

  // CAD → CAD short-circuits per PRD §26.4.
  if (from === 'CAD') {
    const data: FxResponseData = {
      from: 'CAD',
      to: 'CAD',
      rate: 1,
      timestamp: new Date().toISOString(),
      freshness: 'FRESH',
    };
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
