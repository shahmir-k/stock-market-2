// /api/market/quote route tests.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/market-data/twelveData/client', () => ({
  twelveDataFetch: vi.fn(),
}));

import { GET } from '@/app/api/market/quote/route';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';

import { jsonBody, makeReq } from './helpers';

const mocked = vi.mocked(twelveDataFetch);

beforeEach(async () => {
  vi.resetAllMocks();
  const { _clearCache } = await import('@/lib/market-data/cache');
  _clearCache();
});

function tdQuote(overrides: Record<string, unknown> = {}) {
  return {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    close: '212.44',
    previous_close: '210.00',
    open: '211.50',
    high: '214.00',
    low: '210.80',
    timestamp: Math.floor(Date.now() / 1000),
    ...overrides,
  };
}

describe('GET /api/market/quote', () => {
  it('A-QUO-001: valid symbol returns full QuoteResponseData with freshness', async () => {
    mocked.mockResolvedValue({ ok: true, data: tdQuote() });
    const res = await GET(makeReq('/api/market/quote?symbol=AAPL&unique=A-QUO-001'));
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    const data = body.data as { freshness: string; priceNative: number };
    expect(data.freshness).toBeTruthy();
    expect(data.priceNative).toBe(212.44);
  });

  it('A-QUO-002: fresh quote (now) → FRESH freshness', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: tdQuote({ timestamp: Math.floor(Date.now() / 1000) }),
    });
    const res = await GET(makeReq('/api/market/quote?symbol=AAPL&unique=A-QUO-002'));
    const body = await jsonBody(res);
    expect((body.data as { freshness: string }).freshness).toBe('FRESH');
  });

  it('A-QUO-003: stale quote (>5m old) → STALE', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: tdQuote({
        timestamp: Math.floor(Date.now() / 1000) - 60 * 60, // 1 hour ago
      }),
    });
    const res = await GET(makeReq('/api/market/quote?symbol=AAPL&unique=A-QUO-003'));
    const body = await jsonBody(res);
    expect((body.data as { freshness: string }).freshness).toBe('STALE');
  });

  it('A-QUO-004: unsupported exchange → QUOTE_UNAVAILABLE (normalizer returns null)', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: tdQuote({ exchange: 'XETRA', currency: 'EUR' }),
    });
    const res = await GET(makeReq('/api/market/quote?symbol=BMW&unique=A-QUO-004'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('QUOTE_UNAVAILABLE');
  });

  it('A-QUO-005: upstream missing quote → QUOTE_UNAVAILABLE', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: tdQuote({ close: '0' }),
    });
    const res = await GET(makeReq('/api/market/quote?symbol=AAPL&unique=A-QUO-005'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('QUOTE_UNAVAILABLE');
  });

  it('A-QUO-006: cache hit returns cached:true', async () => {
    mocked.mockResolvedValue({ ok: true, data: tdQuote() });
    await GET(makeReq('/api/market/quote?symbol=CACHED01'));
    const res2 = await GET(makeReq('/api/market/quote?symbol=CACHED01'));
    const body = await jsonBody(res2);
    expect(body.cached).toBe(true);
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it('A-QUO-007: missing symbol → MISSING_QUERY', async () => {
    const res = await GET(makeReq('/api/market/quote'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('MISSING_QUERY');
  });
});
