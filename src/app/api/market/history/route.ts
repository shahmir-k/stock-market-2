import { NextRequest } from 'next/server';

import { apiError, apiOk } from '@/lib/market-data/api/envelope';
import { CACHE_TTL, getCached, setCached } from '@/lib/market-data/cache';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';
import {
  normalizeHistory,
  type TdHistoryResponse,
} from '@/lib/market-data/twelveData/normalize';
import type { HistoricalPriceResponseData } from '@/types/market';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.trim();
  const interval = req.nextUrl.searchParams.get('interval')?.trim() ?? '1day';
  const outputsize = Number(
    req.nextUrl.searchParams.get('outputsize') ?? '30',
  );
  // Optional date range — used by the backtest tool. When present, Twelve
  // Data ignores outputsize and returns every point in the range.
  const startDate = req.nextUrl.searchParams.get('start_date')?.trim();
  const endDate = req.nextUrl.searchParams.get('end_date')?.trim();

  if (!symbol) {
    return apiError('MISSING_QUERY', 'Missing symbol parameter.');
  }
  if (interval !== '1day') {
    return apiError(
      'UNSUPPORTED_ASSET',
      'Only the 1day interval is supported in the MVP.',
    );
  }

  const cacheKey = startDate
    ? `history:${symbol}:${interval}:range:${startDate}:${endDate ?? 'now'}`
    : `history:${symbol}:${interval}:${outputsize}`;
  const cached = getCached<HistoricalPriceResponseData>(cacheKey);
  if (cached) {
    return apiOk(cached, { cached: true });
  }

  const query: Record<string, string | number | undefined> = {
    symbol,
    interval,
  };
  if (startDate) {
    query.start_date = startDate;
    if (endDate) query.end_date = endDate;
    // Twelve Data caps a single response at 5000 points; force it.
    query.outputsize = 5000;
  } else {
    query.outputsize = outputsize;
  }

  const result = await twelveDataFetch<TdHistoryResponse>('time_series', query);
  if (!result.ok) {
    return apiError(result.code, result.message, result.details);
  }
  const points = normalizeHistory(result.data);
  const payload: HistoricalPriceResponseData = {
    symbol,
    interval: '1day',
    points,
  };
  setCached(cacheKey, payload, CACHE_TTL.HISTORY_MS);
  return apiOk(payload);
}
