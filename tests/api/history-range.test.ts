// /api/market/history/range route tests.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/market-data/twelveData/client', () => ({
  twelveDataFetch: vi.fn(),
}));

import { GET } from '@/app/api/market/history/range/route';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';

import { jsonBody, makeReq } from './helpers';

const mocked = vi.mocked(twelveDataFetch);

beforeEach(async () => {
  vi.resetAllMocks();
  const { _clearCache } = await import('@/lib/market-data/cache');
  _clearCache();
});

// Twelve Data returns values newest-first; mimic that so the route's reverse()
// produces chronological output.
function tdHistory(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const out: { datetime: string; open: string; high: string; low: string; close: string }[] = [];
  for (let t = end.getTime(); t >= start.getTime(); t -= 24 * 60 * 60 * 1000) {
    const d = new Date(t).toISOString().slice(0, 10);
    out.push({ datetime: d, open: '100', high: '101', low: '99', close: '100' });
  }
  return { values: out, meta: { symbol: 'AAPL', interval: '1day' } };
}

describe('GET /api/market/history/range', () => {
  it('returns earliest + latest from the Twelve Data response', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: tdHistory('2015-01-02', '2025-12-31'),
    });
    const res = await GET(makeReq('/api/market/history/range?symbol=AAPL'));
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    const data = body.data as {
      symbol: string;
      earliestDate: string;
      latestDate: string;
    };
    expect(data.symbol).toBe('AAPL');
    expect(data.earliestDate).toBe('2015-01-02');
    expect(data.latestDate).toBe('2025-12-31');
  });

  it('caches a successful response', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: tdHistory('2020-01-02', '2025-12-31'),
    });
    await GET(makeReq('/api/market/history/range?symbol=CACHE_HRANGE'));
    const res2 = await GET(makeReq('/api/market/history/range?symbol=CACHE_HRANGE'));
    const body = await jsonBody(res2);
    expect(body.cached).toBe(true);
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it('empty points → HISTORY_UNAVAILABLE', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: { values: [], meta: { symbol: 'AAPL', interval: '1day' } },
    });
    const res = await GET(makeReq('/api/market/history/range?symbol=AAPL&unique=empty'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('HISTORY_UNAVAILABLE');
  });

  it('missing symbol → MISSING_QUERY', async () => {
    const res = await GET(makeReq('/api/market/history/range'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('MISSING_QUERY');
    expect(res.status).toBe(400);
  });

  it('passes upstream errors through', async () => {
    mocked.mockResolvedValue({
      ok: false,
      code: 'RATE_LIMITED',
      message: 'too many requests',
    });
    const res = await GET(makeReq('/api/market/history/range?symbol=AAPL&unique=ratelim'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('RATE_LIMITED');
  });
});
