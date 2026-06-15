// Module-level TTL cache used by all /api/market/* routes per PRD §14.5.
//
// This is BEST-EFFORT on Vercel — serverless cold starts will discard the
// cache. That's acceptable for MVP because a cold start happens at most a
// few times per hour under normal load, and Twelve Data's rate limits are
// generous enough to absorb the misses.

type Entry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, Entry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key) as Entry<T> | undefined;
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Test-only — wipe the module-level cache so tests don't leak through it.
// Safe to ship; nothing in production calls this.
export function _clearCache(): void {
  store.clear();
}

// PRD §14.5 cache durations.
export const CACHE_TTL = {
  QUOTE_MS: 2 * 60 * 1000,
  FX_MS: 15 * 60 * 1000,
  SEARCH_MS: 10 * 60 * 1000,
  HISTORY_MS: 30 * 60 * 1000,
  // Company profile (sector/industry/website). Rarely changes; long TTL.
  PROFILE_MS: 24 * 60 * 60 * 1000,
  // Time-travel: the earliest available date is essentially stable, so we can
  // hold the range result for a full day before re-fetching.
  HISTORY_RANGE_MS: 24 * 60 * 60 * 1000,
  // Time-travel: a historical FX bar is immutable — cache for a week.
  FX_HISTORICAL_MS: 7 * 24 * 60 * 60 * 1000,
} as const;
