// /api/market/profile route tests — sectorMap fallback + Twelve Data /profile

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/market-data/twelveData/client', () => ({
  twelveDataFetch: vi.fn(),
}));

import { GET } from '@/app/api/market/profile/route';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';

import { jsonBody, makeReq } from './helpers';

const mocked = vi.mocked(twelveDataFetch);

beforeEach(async () => {
  vi.resetAllMocks();
  const { _clearCache } = await import('@/lib/market-data/cache');
  _clearCache();
});

describe('GET /api/market/profile', () => {
  it('A-PRF-001: known symbol hits sectorMap, no upstream call (R-BUG-007)', async () => {
    const res = await GET(makeReq('/api/market/profile?symbol=AAPL'));
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    expect((body.data as { sector: string }).sector).toBe('Technology');
    // Twelve Data was never called — sectorMap short-circuits
    expect(mocked).not.toHaveBeenCalled();
  });

  it('A-PRF-003: paid-plan 403 gracefully returns empty profile, no error', async () => {
    mocked.mockResolvedValue({
      ok: false,
      code: 'TWELVE_DATA_ERROR',
      message: '/profile is available exclusively with paid plans',
    });
    const res = await GET(makeReq('/api/market/profile?symbol=ZZZ_NOT_IN_MAP'));
    const body = await jsonBody(res);
    // We return ok:true with sector:undefined rather than propagate error
    expect(body.ok).toBe(true);
    expect((body.data as { sector?: string }).sector).toBeUndefined();
  });

  it('A-PRF-002: when Twelve Data returns sector for unknown-to-map symbol, propagate it', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: { symbol: 'XXX_PROFILE_TEST', sector: 'Real Estate' },
    });
    const res = await GET(makeReq('/api/market/profile?symbol=XXX_PROFILE_TEST'));
    const body = await jsonBody(res);
    expect((body.data as { sector: string }).sector).toBe('Real Estate');
  });

  it('A-PRF-005: missing symbol → MISSING_QUERY', async () => {
    const res = await GET(makeReq('/api/market/profile'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('MISSING_QUERY');
  });

  it('A-PRF-004: cache hit on second call for same symbol', async () => {
    // First call hits sectorMap (known symbol → cached immediately)
    await GET(makeReq('/api/market/profile?symbol=MSFT'));
    const res2 = await GET(makeReq('/api/market/profile?symbol=MSFT'));
    const body = await jsonBody(res2);
    expect(body.cached).toBe(true);
  });
});
