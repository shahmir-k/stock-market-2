// @vitest-environment jsdom

// Mode toggle persistence — the active marketDataMode survives a store
// reload and changes which provider getQuote/getHistoricalPrices uses.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => {
    throw new Error('no supabase in test');
  },
}));

beforeEach(async () => {
  window.localStorage.clear();
  const { useSimulatorStore } = await import('@/store/simulatorStore');
  useSimulatorStore.setState((s) => ({ ...s, marketDataMode: 'MOCK' }));
});

describe('store: marketDataMode switching', () => {
  it('I-MODE-001: setMarketDataMode flips the store value', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    expect(useSimulatorStore.getState().marketDataMode).toBe('MOCK');
    useSimulatorStore.getState().setMarketDataMode('API');
    expect(useSimulatorStore.getState().marketDataMode).toBe('API');
  });

  it('I-MODE-002: previewBuy in MOCK mode uses deterministic mock price', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    useSimulatorStore.setState((s) => ({ ...s, marketDataMode: 'MOCK' }));

    // Mock TD.TO basePrice from mockAssets is deterministic per symbol
    const p1 = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    const p2 = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    // Deterministic — both previews use the same mock price
    expect(p1.priceCad).toBeCloseTo(p2.priceCad, 4);
  });

  it('I-MODE-003: mode persists across a saveState/loadState round-trip', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    useSimulatorStore.setState((s) => ({ ...s, marketDataMode: 'MOCK' }));
    await useSimulatorStore.getState().saveState();

    // Reset store to defaults then load from localStorage
    useSimulatorStore.setState((s) => ({ ...s, marketDataMode: 'API', isHydrated: false }));
    await useSimulatorStore.getState().loadState();
    expect(useSimulatorStore.getState().marketDataMode).toBe('MOCK');
  });
});
