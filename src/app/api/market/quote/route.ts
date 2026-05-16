import { NextRequest } from 'next/server';

import { apiError, apiOk } from '@/lib/market-data/api/envelope';
import { CACHE_TTL, getCached, setCached } from '@/lib/market-data/cache';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';
import {
  normalizeQuote,
  type TdQuote,
} from '@/lib/market-data/twelveData/normalize';
import type { QuoteResponseData } from '@/types/market';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.trim();
  const exchange = req.nextUrl.searchParams.get('exchange')?.trim();
  if (!symbol) {
    return apiError('MISSING_QUERY', 'Missing symbol parameter.');
  }

  const cacheKey = `quote:${symbol}:${exchange ?? ''}`;
  const cached = getCached<QuoteResponseData>(cacheKey);
  if (cached) {
    return apiOk(cached, { cached: true });
  }

  const result = await twelveDataFetch<TdQuote>('quote', {
    symbol,
    exchange,
  });
  if (!result.ok) {
    return apiError(result.code, result.message, result.details);
  }
  const normalized = normalizeQuote(result.data);
  if (!normalized) {
    return apiError('QUOTE_UNAVAILABLE', 'Quote unavailable for this asset.');
  }
  setCached(cacheKey, normalized, CACHE_TTL.QUOTE_MS);
  return apiOk(normalized);
}
