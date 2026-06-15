// /api/market/history/range — slider bounds for the time-travel feature.
// Asks Twelve Data for outputsize=5000 at 1day interval and returns the
// bookend timestamps. Cached aggressively (24h) because earliest available
// date is essentially stable per symbol.

import { NextRequest } from 'next/server';

import { apiError, apiOk } from '@/lib/market-data/api/envelope';
import { CACHE_TTL, getCached, setCached } from '@/lib/market-data/cache';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';
import {
  normalizeHistory,
  type TdHistoryResponse,
} from '@/lib/market-data/twelveData/normalize';
import type { HistoryRangeResponseData } from '@/types/market';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.trim();
  if (!symbol) {
    return apiError('MISSING_QUERY', 'Missing symbol parameter.');
  }

  const cacheKey = `history-range:${symbol}`;
  const cached = getCached<HistoryRangeResponseData>(cacheKey);
  if (cached) {
    return apiOk(cached, { cached: true });
  }

  const result = await twelveDataFetch<TdHistoryResponse>('time_series', {
    symbol,
    interval: '1day',
    outputsize: 5000,
  });
  if (!result.ok) {
    return apiError(result.code, result.message, result.details);
  }

  const points = normalizeHistory(result.data);
  if (points.length === 0) {
    return apiError('HISTORY_UNAVAILABLE', 'No history for this symbol.');
  }

  const data: HistoryRangeResponseData = {
    symbol,
    earliestDate: points[0].timestamp.slice(0, 10),
    latestDate: points[points.length - 1].timestamp.slice(0, 10),
  };
  setCached(cacheKey, data, CACHE_TTL.HISTORY_RANGE_MS);
  return apiOk(data);
}
