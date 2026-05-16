// Map a quote/FX timestamp to the PRD §16 freshness band.

import type { Freshness } from '@/types/market';

const TWO_MIN_MS = 2 * 60 * 1000;
const FIVE_MIN_MS = 5 * 60 * 1000;

export function computeFreshness(timestamp: string | Date | null | undefined): Freshness {
  if (!timestamp) return 'UNAVAILABLE';
  const ts = typeof timestamp === 'string' ? Date.parse(timestamp) : timestamp.getTime();
  if (!Number.isFinite(ts)) return 'UNAVAILABLE';
  const ageMs = Date.now() - ts;
  if (ageMs <= TWO_MIN_MS) return 'FRESH';
  if (ageMs <= FIVE_MIN_MS) return 'RECENT';
  return 'STALE';
}
