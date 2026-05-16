// /api/market/search route tests.
// Mocks twelveDataFetch and verifies envelope, dedup, error codes.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/market-data/twelveData/client', () => ({
  twelveDataFetch: vi.fn(),
}));

// Clear the module-level cache between tests by re-importing the module.
vi.mock('@/lib/market-data/cache', async () => {
  const actual = await vi.importActual<typeof import('@/lib/market-data/cache')>(
    '@/lib/market-data/cache',
  );
  return actual;
});

import { GET } from '@/app/api/market/search/route';
import { twelveDataFetch } from '@/lib/market-data/twelveData/client';

import { jsonBody, makeReq } from './helpers';

const mocked = vi.mocked(twelveDataFetch);

beforeEach(async () => {
  vi.resetAllMocks();
  const { _clearCache } = await import('@/lib/market-data/cache');
  _clearCache();
});

describe('GET /api/market/search', () => {
  it('A-SRC-001: empty query returns ok with empty array', async () => {
    const res = await GET(makeReq('/api/market/search?q='));
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    expect(body.data).toEqual([]);
    expect(mocked).not.toHaveBeenCalled();
  });

  it('A-SRC-002: valid query returns normalized results', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            symbol: 'AAPL',
            instrument_name: 'Apple Inc.',
            exchange: 'NASDAQ',
            instrument_type: 'Common Stock',
            currency: 'USD',
          },
        ],
      },
    });
    const res = await GET(makeReq('/api/market/search?q=apple'));
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect((body.data as unknown[]).length).toBe(1);
  });

  it('A-SRC-005: dedupes (symbol, exchange, currency) — R-BUG-003 regression', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: {
        data: [
          {
            symbol: 'AAPL',
            instrument_name: 'Apple Inc.',
            exchange: 'NASDAQ',
            mic_code: 'XNAS',
            instrument_type: 'Common Stock',
            currency: 'USD',
          },
          {
            symbol: 'AAPL',
            instrument_name: 'Apple Inc.',
            exchange: 'NASDAQ',
            mic_code: 'BATS', // different mic, same listing
            instrument_type: 'Common Stock',
            currency: 'USD',
          },
        ],
      },
    });
    const res = await GET(makeReq('/api/market/search?q=aapl'));
    const body = await jsonBody(res);
    expect((body.data as unknown[]).length).toBe(1);
  });

  it('A-SRC-006: cache hit returns cached:true', async () => {
    mocked.mockResolvedValue({
      ok: true,
      data: { data: [{ symbol: 'X', instrument_name: 'X', exchange: 'NASDAQ', instrument_type: 'Common Stock', currency: 'USD' }] },
    });
    await GET(makeReq('/api/market/search?q=cachetest'));
    const res2 = await GET(makeReq('/api/market/search?q=cachetest'));
    const body = await jsonBody(res2);
    expect(body.cached).toBe(true);
    expect(mocked).toHaveBeenCalledTimes(1); // 2nd call hit cache
  });

  it('A-SRC-007: rate-limit error propagates RATE_LIMITED code', async () => {
    mocked.mockResolvedValue({
      ok: false,
      code: 'RATE_LIMITED',
      message: 'Too many requests',
    });
    const res = await GET(makeReq('/api/market/search?q=foo'));
    const body = await jsonBody(res);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe('RATE_LIMITED');
    expect(res.status).toBe(429);
  });

  it('A-SRC-008: provider 500 → TWELVE_DATA_ERROR', async () => {
    mocked.mockResolvedValue({
      ok: false,
      code: 'TWELVE_DATA_ERROR',
      message: 'Upstream error',
    });
    const res = await GET(makeReq('/api/market/search?q=foo2'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('TWELVE_DATA_ERROR');
    expect(res.status).toBe(502);
  });

  it('A-SRC-009: network failure → NETWORK_ERROR', async () => {
    mocked.mockResolvedValue({
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'Could not reach provider',
    });
    const res = await GET(makeReq('/api/market/search?q=foo3'));
    const body = await jsonBody(res);
    expect(body.error?.code).toBe('NETWORK_ERROR');
  });
});
