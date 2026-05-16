// Integration tests against the real Zustand store + mock provider.
// localStorage is shimmed in node via the 'jsdom' env.

// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mute Supabase client errors when running outside the browser/env.
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => {
    throw new Error('no supabase in test');
  },
}));

// Force market data mode to MOCK so the store calls the deterministic provider.
beforeEach(async () => {
  const { useSimulatorStore } = await import('@/store/simulatorStore');
  useSimulatorStore.setState((s) => ({ ...s, marketDataMode: 'MOCK' }));
});

describe('store: buy → portfolio updates', () => {
  it('start → buy AAPL → cash decreases, holding appears', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation('Tester');
    const startCash = useSimulatorStore.getState().portfolio.cashCad;
    expect(startCash).toBe(5000);

    const preview = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    expect(preview.totalCad).toBeGreaterThan(0);

    const result = await useSimulatorStore.getState().executeBuy(preview);
    expect(result.success).toBe(true);

    const after = useSimulatorStore.getState().portfolio;
    expect(after.cashCad).toBeLessThan(startCash);
    expect(after.holdings.length).toBe(1);
    expect(after.holdings[0].symbol).toBe('TD.TO');
  });
});

describe('store: buy existing → average cost updates', () => {
  it('two buys at different prices average correctly', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const p1 = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(p1);
    const p2 = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(p2);

    const holding = useSimulatorStore.getState().portfolio.holdings[0];
    expect(holding.quantity).toBe(2);
    // Average cost should be the mean of the two execution prices.
    expect(holding.averageCostCad).toBeCloseTo((p1.priceCad + p2.priceCad) / 2, 4);
  });
});

describe('store: sell → realized gain updates', () => {
  it('partial sell does not change avg cost', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 2 });
    await useSimulatorStore.getState().executeBuy(buy);
    const avgBefore = useSimulatorStore.getState().portfolio.holdings[0].averageCostCad;

    const sell = await useSimulatorStore
      .getState()
      .previewSell({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeSell(sell);

    const holding = useSimulatorStore.getState().portfolio.holdings[0];
    expect(holding.quantity).toBe(1);
    expect(holding.averageCostCad).toBe(avgBefore);
  });

  it('full sell removes the holding', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy);

    const sell = await useSimulatorStore
      .getState()
      .previewSell({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeSell(sell);

    expect(useSimulatorStore.getState().portfolio.holdings.length).toBe(0);
  });
});

describe('store: reset clears state', () => {
  it('reset restores cash to 5000 and clears holdings/transactions', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy);

    await useSimulatorStore.getState().resetSimulation();
    const p = useSimulatorStore.getState().portfolio;
    expect(p.cashCad).toBe(5000);
    expect(p.holdings.length).toBe(0);
    expect(p.transactions.length).toBe(0);
  });
});
