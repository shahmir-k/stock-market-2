import { NextRequest } from 'next/server';

import { apiError, apiOk } from '@/lib/market-data/api/envelope';
import { CACHE_TTL, getCached, setCached } from '@/lib/market-data/cache';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';
import {
  normalizeSearch,
  type TdSearchResponse,
} from '@/lib/market-data/twelveData/normalize';
import type { AssetSearchResult } from '@/types/market';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length === 0) {
    // Empty query → empty array per PRD §26.1.
    return apiOk<AssetSearchResult[]>([]);
  }

  const cacheKey = `search:${q.toLowerCase()}`;
  const cached = getCached<AssetSearchResult[]>(cacheKey);
  if (cached) {
    return apiOk(cached, { cached: true });
  }

  const result = await twelveDataFetch<TdSearchResponse>('symbol_search', {
    symbol: q,
    outputsize: 30,
  });
  if (!result.ok) {
    return apiError(result.code, result.message, result.details);
  }
  const normalized = normalizeSearch(result.data);
  setCached(cacheKey, normalized, CACHE_TTL.SEARCH_MS);
  return apiOk(normalized);
}
