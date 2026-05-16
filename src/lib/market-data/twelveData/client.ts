// Server-only Twelve Data fetch wrapper. Reads TWELVE_DATA_API_KEY from the
// process env — never exposed to the browser per PRD §14.2.

import 'server-only';

import type { ApiErrorCode } from '@/types/market';

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';

export type TwelveDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ApiErrorCode; message: string; details?: unknown };

function getApiKey(): string {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) {
    throw new Error(
      'TWELVE_DATA_API_KEY is not set. Add it to .env.local or Vercel project env.',
    );
  }
  return key;
}

export async function twelveDataFetch<T>(
  path: string,
  query: Record<string, string | number | undefined>,
): Promise<TwelveDataResult<T>> {
  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (err) {
    return {
      ok: false,
      code: 'UNKNOWN_ERROR',
      message: err instanceof Error ? err.message : 'Server misconfigured',
    };
  }

  const url = new URL(`${TWELVE_DATA_BASE}/${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  url.searchParams.set('apikey', apiKey);

  let res: Response;
  try {
    res = await fetch(url.toString(), { cache: 'no-store' });
  } catch (err) {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'Could not reach the market data provider.',
      details: err instanceof Error ? err.message : err,
    };
  }

  if (res.status === 429) {
    return {
      ok: false,
      code: 'RATE_LIMITED',
      message: 'The market data provider rate limit was reached. Try again later.',
    };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch (err) {
    return {
      ok: false,
      code: 'TWELVE_DATA_ERROR',
      message: 'Invalid response from the market data provider.',
      details: err instanceof Error ? err.message : err,
    };
  }

  // Twelve Data returns { code: number, message: string, status: 'error' } on
  // some endpoints when something is wrong. Treat as TWELVE_DATA_ERROR unless
  // the code/message hints at something more specific.
  if (
    body &&
    typeof body === 'object' &&
    'status' in body &&
    (body as { status?: string }).status === 'error'
  ) {
    const maybeMessage = (body as { message?: unknown }).message;
    const tdMessage =
      typeof maybeMessage === 'string'
        ? maybeMessage
        : 'Provider returned an error.';
    return {
      ok: false,
      code: 'TWELVE_DATA_ERROR',
      message: tdMessage,
      details: body,
    };
  }

  return { ok: true, data: body as T };
}
