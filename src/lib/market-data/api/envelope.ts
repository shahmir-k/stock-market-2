// API envelope helpers used by all /api/market/* route handlers.
// Returns NextResponse-compatible JSON bodies in the shape defined in PRD §26.

import { NextResponse } from 'next/server';

import type { ApiError, ApiErrorCode, ApiSuccess } from '@/types/market';

export function apiOk<T>(data: T, opts?: { cached?: boolean }): NextResponse {
  const body: ApiSuccess<T> = {
    ok: true,
    data,
    cached: opts?.cached,
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(body);
}

const STATUS_FOR_CODE: Partial<Record<ApiErrorCode, number>> = {
  MISSING_QUERY: 400,
  INVALID_SYMBOL: 400,
  UNSUPPORTED_ASSET: 422,
  UNSUPPORTED_EXCHANGE: 422,
  UNSUPPORTED_CURRENCY: 422,
  QUOTE_UNAVAILABLE: 404,
  HISTORY_UNAVAILABLE: 404,
  FX_UNAVAILABLE: 503,
  RATE_LIMITED: 429,
  TWELVE_DATA_ERROR: 502,
  NETWORK_ERROR: 502,
  UNKNOWN_ERROR: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): NextResponse {
  const body: ApiError = {
    ok: false,
    error: { code, message, details },
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: STATUS_FOR_CODE[code] ?? 500 });
}
