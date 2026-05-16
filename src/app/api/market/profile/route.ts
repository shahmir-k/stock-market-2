import { NextRequest } from 'next/server';

import { apiError, apiOk } from '@/lib/market-data/api/envelope';
import { CACHE_TTL, getCached, setCached } from '@/lib/market-data/cache';
import { getKnownSector } from '@/lib/market-data/sectorMap';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';
import {
  normalizeProfile,
  type TdProfile,
} from '@/lib/market-data/twelveData/normalize';
import type { ProfileResponseData } from '@/types/market';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.trim();
  if (!symbol) {
    return apiError('MISSING_QUERY', 'Missing required query param: symbol');
  }

  const cacheKey = `profile:${symbol.toUpperCase()}`;
  const cached = getCached<ProfileResponseData>(cacheKey);
  if (cached) {
    return apiOk(cached, { cached: true });
  }

  // Twelve Data's /profile endpoint requires a paid plan, so check our local
  // sector map first. Most common symbols hit here; for the long tail we try
  // Twelve Data and let it 403 cleanly.
  const knownSector = getKnownSector(symbol);
  if (knownSector) {
    const data: ProfileResponseData = { symbol, sector: knownSector };
    setCached(cacheKey, data, CACHE_TTL.PROFILE_MS);
    return apiOk(data);
  }

  const result = await twelveDataFetch<TdProfile>('profile', { symbol });
  if (!result.ok) {
    // Profile endpoint requires a paid plan — return empty profile rather
    // than propagating the error, so the holding just shows "Unknown".
    const data: ProfileResponseData = { symbol };
    setCached(cacheKey, data, CACHE_TTL.PROFILE_MS);
    return apiOk(data);
  }
  const normalized = normalizeProfile(symbol, result.data);
  setCached(cacheKey, normalized, CACHE_TTL.PROFILE_MS);
  return apiOk(normalized);
}
