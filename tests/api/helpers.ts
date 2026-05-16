// Shared helpers for API route tests.

import { NextRequest } from 'next/server';

export function makeReq(url: string): NextRequest {
  // Next requires an absolute URL when building NextRequest
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

export async function jsonBody(res: Response): Promise<{
  ok: boolean;
  data?: unknown;
  error?: { code: string; message: string };
  cached?: boolean;
  fetchedAt: string;
}> {
  return await res.json();
}
