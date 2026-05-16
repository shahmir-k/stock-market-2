// @vitest-environment jsdom

// Regression for R-BUG-006: concurrent refreshHoldingQuotes calls used to
// race and create duplicate holdings rows. Now deduped via inFlight Promise
// at the store layer (and the Supabase UNIQUE(portfolio_id, symbol) constraint
// is the DB belt-and-braces).

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => {
    throw new Error('no supabase in test');
  },
}));

beforeEach(async () => {
  const { useSimulatorStore } = await import('@/store/simulatorStore');
  useSimulatorStore.setState((s) => ({ ...s, marketDataMode: 'MOCK' }));
});

describe('store: refreshHoldingQuotes is idempotent under concurrent calls (R-BUG-006)', () => {
  it('I-REF-003: 3 parallel refresh calls produce a single holdings update', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 2 });
    await useSimulatorStore.getState().executeBuy(buy);

    const before = useSimulatorStore.getState().portfolio.holdings;
    expect(before.length).toBe(1);

    // Fire three concurrent refreshes
    await Promise.all([
      useSimulatorStore.getState().refreshHoldingQuotes(),
      useSimulatorStore.getState().refreshHoldingQuotes(),
      useSimulatorStore.getState().refreshHoldingQuotes(),
    ]);

    const after = useSimulatorStore.getState().portfolio.holdings;
    // Holdings count unchanged. No duplicate rows. Same symbol still there.
    expect(after.length).toBe(1);
    expect(after[0].symbol).toBe('TD.TO');
    expect(after[0].quantity).toBe(2);
  });

  it('I-TRD-005 (R-BUG-006): buy followed by immediate refresh ≠ duplicate', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy);

    // Buy then refresh in rapid succession — the kind of pattern that
    // React StrictMode's double-effect creates.
    await Promise.all([
      useSimulatorStore.getState().refreshHoldingQuotes(),
      useSimulatorStore.getState().refreshHoldingQuotes(),
    ]);

    const holdings = useSimulatorStore.getState().portfolio.holdings;
    expect(holdings.length).toBe(1);
  });
});
