// @vitest-environment jsdom

// localStorage persistence — save/load round-trip + corruption recovery
// per PRD §18.6. Uses jsdom's window.localStorage.

import { beforeEach, describe, expect, it } from 'vitest';

import {
  STORAGE_KEY,
  STORAGE_VERSION,
  clearLocalStorage,
  loadFromLocalStorage,
  saveToLocalStorage,
  type PersistedState,
} from '@/lib/persistence/localStorage';

function validState(): PersistedState {
  return {
    version: STORAGE_VERSION,
    user: { id: 'u1', displayName: 'Test' },
    simulation: {
      startingBalanceCad: 5000,
      baseCurrency: 'CAD',
      allowFractionalShares: true,
      allowCrypto: false,
      allowOptions: false,
      allowMargin: false,
      allowShortSelling: false,
      feesEnabled: false,
    },
    portfolio: {
      cashCad: 5000,
      startingBalanceCad: 5000,
      realizedGainLossCad: 0,
      holdings: [],
      transactions: [],
      snapshots: [],
    },
    warnings: [],
    marketDataMode: 'API',
    fxRateUsdCad: 1.35,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('saveToLocalStorage + loadFromLocalStorage', () => {
  it('U-PERSIST-001: round-trips a valid state', () => {
    const state = validState();
    expect(saveToLocalStorage(state)).toBe(true);
    const r = loadFromLocalStorage();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.user?.id).toBe('u1');
      expect(r.state.portfolio.cashCad).toBe(5000);
    }
  });

  it('always writes with STORAGE_VERSION even if caller passes a different version', () => {
    const state = { ...validState(), version: 999 } as PersistedState;
    saveToLocalStorage(state);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(STORAGE_VERSION);
  });
});

describe('loadFromLocalStorage', () => {
  it('U-PERSIST-002: returns EMPTY when no key set', () => {
    const r = loadFromLocalStorage();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('EMPTY');
  });

  it('U-PERSIST-003: returns CORRUPTED on invalid JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, 'not json{');
    const r = loadFromLocalStorage();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('CORRUPTED');
  });

  it('U-PERSIST-003: returns CORRUPTED on wrong shape', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ random: 'data' }));
    const r = loadFromLocalStorage();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('CORRUPTED');
  });

  it('U-PERSIST-004: returns VERSION_MISMATCH on old version', () => {
    const old = { ...validState(), version: 0 };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(old));
    const r = loadFromLocalStorage();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('VERSION_MISMATCH');
  });
});

describe('clearLocalStorage', () => {
  it('removes the persisted key', () => {
    saveToLocalStorage(validState());
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    clearLocalStorage();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
