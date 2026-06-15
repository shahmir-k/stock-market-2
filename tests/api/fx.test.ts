// /api/market/fx route tests.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/market-data/twelveData/client', () => ({
  twelveDataFetch: vi.fn(),
}));

import { GET } from '@/app/api/market/fx/route';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';

import { jsonBody, makeReq } from './helpers';

const mocked = vi.mocked(twelveDataFetch);

beforeEach(async () => {
  vi.resetAllMocks();
  const { _clearCache } = await import('@/lib/market-data/cache');
  _clearCache();
});

describe('GET /api/market/fx', () => {
  it('A-FX-001: CAD→CAD short-circuits to rate=1 without upstream call', async () => {
    const res = await GET(makeReq('/api/market/fx?from=CAD&to=CAD'));
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    const data = body.data as { rate: number; freshness: string };
    expect(data.rate).toBe(1);
    expect(data.freshness).toBe('FRESH');
    expect(mocked).not.toHaveBeenCalled();
  });

  it('A-FX-002: USD→CAD returns rate + freshness', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: { symbol: 'USD/CAD', rate: 1.37, timestamp: Math.floor(Date.now() / 1000) },
    });
    const res = await GET(makeReq('/api/market/fx?from=USD&to=CAD&unique=A-FX-002'));
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    const data = body.data as { rate: number };
    expect(data.rate).toBe(1.37);
  });

  it('A-FX-003: rate=0 or NaN → FX_UNAVAILABLE', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: { symbol: 'USD/CAD', rate: 0 },
    });
    const res = await GET(makeReq('/api/market/fx?from=USD&to=CAD&unique=A-FX-003'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('FX_UNAVAILABLE');
    expect(res.status).toBe(503);
  });

  it('A-FX-005: unsupported to currency → UNSUPPORTED_CURRENCY', async () => {
    const res = await GET(makeReq('/api/market/fx?from=USD&to=EUR'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('UNSUPPORTED_CURRENCY');
  });

  it('A-FX-005: unsupported from currency → UNSUPPORTED_CURRENCY', async () => {
    const res = await GET(makeReq('/api/market/fx?from=EUR&to=CAD'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('UNSUPPORTED_CURRENCY');
  });

  it('A-FX-006: missing from → MISSING_QUERY', async () => {
    const res = await GET(makeReq('/api/market/fx?to=CAD'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('MISSING_QUERY');
    expect(res.status).toBe(400);
  });

  it('A-FX-007: ?date= calls time_series with start_date=end_date=date', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: {
        meta: { symbol: 'USD/CAD', interval: '1day' },
        values: [
          { datetime: '2020-01-02', open: '1.30', high: '1.30', low: '1.30', close: '1.301' },
        ],
      },
    });
    const res = await GET(
      makeReq('/api/market/fx?from=USD&to=CAD&date=2020-01-02&unique=A-FX-007'),
    );
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    const data = body.data as { rate: number; date: string };
    expect(data.rate).toBe(1.301);
    expect(data.date).toBe('2020-01-02');
    const callArgs = mocked.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(callArgs?.start_date).toBe('2020-01-02');
    expect(callArgs?.end_date).toBe('2020-01-02');
  });

  it('A-FX-008: historical request caches under date-scoped key', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: {
        meta: { symbol: 'USD/CAD', interval: '1day' },
        values: [
          { datetime: '2021-06-15', open: '1.20', high: '1.21', low: '1.19', close: '1.205' },
        ],
      },
    });
    await GET(makeReq('/api/market/fx?from=USD&to=CAD&date=2021-06-15&unique=A-FX-008'));
    const res2 = await GET(
      makeReq('/api/market/fx?from=USD&to=CAD&date=2021-06-15&unique=A-FX-008'),
    );
    const body = await jsonBody(res2);
    expect(body.cached).toBe(true);
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it('A-FX-009: ?date= with no upstream data → FX_UNAVAILABLE', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: { meta: { symbol: 'USD/CAD', interval: '1day' }, values: [] },
    });
    const res = await GET(
      makeReq('/api/market/fx?from=USD&to=CAD&date=2020-01-04&unique=A-FX-009'),
    );
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('FX_UNAVAILABLE');
  });

  it('A-FX-010: CAD→CAD with ?date= still short-circuits to rate 1, date echoed back', async () => {
    const res = await GET(
      makeReq('/api/market/fx?from=CAD&to=CAD&date=2018-04-01'),
    );
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    const data = body.data as { rate: number; date?: string };
    expect(data.rate).toBe(1);
    expect(data.date).toBe('2018-04-01');
    expect(mocked).not.toHaveBeenCalled();
  });
});
