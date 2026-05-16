// /api/market/history route tests.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/market-data/twelveData/client', () => ({
  twelveDataFetch: vi.fn(),
}));

import { GET } from '@/app/api/market/history/route';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';

import { jsonBody, makeReq } from './helpers';

const mocked = vi.mocked(twelveDataFetch);

beforeEach(async () => {
  vi.resetAllMocks();
  const { _clearCache } = await import('@/lib/market-data/cache');
  _clearCache();
});

function tdHistory(count: number) {
  // Twelve Data returns newest-first; mimic that so the route's reverse()
  // produces chronological output. Use safe dates (start from 2025-01-01
  // and walk backward by 1 day) so we never construct an invalid date.
  const base = new Date('2025-12-31');
  const values = Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    return {
      datetime: d.toISOString().slice(0, 10),
      open: '100',
      high: '105',
      low: '95',
      close: String(100 + i),
    };
  });
  return { values, meta: { symbol: 'AAPL', interval: '1day' } };
}

describe('GET /api/market/history', () => {
  it('A-HIS-001: default outputsize=30 returns expected count', async () => {
    mocked.mockResolvedValue({ ok: true, data: tdHistory(30) });
    const res = await GET(makeReq('/api/market/history?symbol=AAPL&unique=A-HIS-001'));
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    expect((body.data as { points: unknown[] }).points.length).toBe(30);
  });

  it('A-HIS-002: start_date + end_date forwards range params to Twelve Data', async () => {
    mocked.mockResolvedValue({ ok: true, data: tdHistory(100) });
    const res = await GET(
      makeReq('/api/market/history?symbol=AAPL&start_date=2021-01-01&end_date=2025-12-31'),
    );
    expect(res.status).toBe(200);
    // The mock was called with start_date/end_date in the query
    const callArgs = mocked.mock.calls[0]?.[1] as Record<string, unknown> | undefined;
    expect(callArgs?.start_date).toBe('2021-01-01');
    expect(callArgs?.end_date).toBe('2025-12-31');
    expect(callArgs?.outputsize).toBe(5000); // cap raised when date range present
  });

  it('A-HIS-004: non-1day interval → UNSUPPORTED_ASSET', async () => {
    const res = await GET(makeReq('/api/market/history?symbol=AAPL&interval=1week'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('UNSUPPORTED_ASSET');
  });

  it('A-HIS-005: missing symbol → MISSING_QUERY', async () => {
    const res = await GET(makeReq('/api/market/history'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('MISSING_QUERY');
  });

  it('A-HIS-006: <2 points returns ok with short array (UI handles empty state)', async () => {
    mocked.mockResolvedValue({ ok: true, data: tdHistory(1) });
    const res = await GET(makeReq('/api/market/history?symbol=AAPL&unique=A-HIS-006'));
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    expect((body.data as { points: unknown[] }).points.length).toBe(1);
  });

  it('A-HIS-007: cache key includes date range params', async () => {
    mocked.mockResolvedValue({ ok: true, data: tdHistory(10) });
    // Same symbol, different date ranges → independent cache entries
    await GET(makeReq('/api/market/history?symbol=AAPL&start_date=2020-01-01&end_date=2025-12-31'));
    await GET(makeReq('/api/market/history?symbol=AAPL&start_date=2023-01-01&end_date=2025-12-31'));
    expect(mocked).toHaveBeenCalledTimes(2);
  });

  it('A-HIS-008: identical request hits the cache', async () => {
    mocked.mockResolvedValue({ ok: true, data: tdHistory(10) });
    await GET(makeReq('/api/market/history?symbol=CACHE_HIS_AAPL'));
    const res2 = await GET(makeReq('/api/market/history?symbol=CACHE_HIS_AAPL'));
    const body = await jsonBody(res2);
    expect(body.cached).toBe(true);
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it('A-HIS-009: returns chronologically sorted (oldest first)', async () => {
    mocked.mockResolvedValue({ ok: true, data: tdHistory(5) });
    const res = await GET(makeReq('/api/market/history?symbol=AAPL&unique=A-HIS-009'));
    const body = await jsonBody(res);
    const points = (body.data as { points: { timestamp: string }[] }).points;
    for (let i = 1; i < points.length; i++) {
      expect(points[i].timestamp >= points[i - 1].timestamp).toBe(true);
    }
  });
});
