// Client-side localStorage persistence per PRD §18.6.
// Supabase is the source of truth (PRD §18.5); this is a recovery cache.

import type {
  LocalUser,
  MarketDataMode,
  Portfolio,
  RiskWarning,
  SimulationConfig,
} from '@/types/portfolio';

export const STORAGE_KEY = 'personal-stock-simulator-v1';
export const STORAGE_VERSION = 1;

// Subset of store state we actually persist. Transient fields (auth status,
// sync status, hydration flags) are recomputed on load.
export type PersistedState = {
  version: number;
  user: LocalUser | null;
  simulation: SimulationConfig;
  portfolio: Portfolio;
  warnings: RiskWarning[];
  marketDataMode: MarketDataMode;
  fxRateUsdCad: number | null;
  createdAt: string;
  updatedAt: string;
};

export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const probeKey = '__simulator_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

export function saveToLocalStorage(state: PersistedState): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    const payload: PersistedState = { ...state, version: STORAGE_VERSION };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export type LoadResult =
  | { ok: true; state: PersistedState }
  | { ok: false; reason: 'EMPTY' | 'CORRUPTED' | 'VERSION_MISMATCH' };

export function loadFromLocalStorage(): LoadResult {
  if (!isLocalStorageAvailable()) return { ok: false, reason: 'EMPTY' };
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ok: false, reason: 'CORRUPTED' };
  }
  if (!raw) return { ok: false, reason: 'EMPTY' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'CORRUPTED' };
  }

  if (!isPersistedStateShape(parsed)) {
    return { ok: false, reason: 'CORRUPTED' };
  }
  if (parsed.version !== STORAGE_VERSION) {
    return { ok: false, reason: 'VERSION_MISMATCH' };
  }
  return { ok: true, state: parsed };
}

export function clearLocalStorage(): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore — quota errors etc. shouldn't block reset.
  }
}

// Lightweight shape check. Only validates the top-level structure; nested
// values trust the type system + store reducer to handle edge cases.
function isPersistedStateShape(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === 'number' &&
    typeof v.simulation === 'object' &&
    typeof v.portfolio === 'object' &&
    Array.isArray(v.warnings) &&
    (v.marketDataMode === 'API' || v.marketDataMode === 'MOCK') &&
    (v.fxRateUsdCad === null || typeof v.fxRateUsdCad === 'number') &&
    typeof v.createdAt === 'string' &&
    typeof v.updatedAt === 'string'
  );
}
