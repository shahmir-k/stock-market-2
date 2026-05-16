// @vitest-environment jsdom

// Warning lifecycle integration tests — covers PRD §24.10 dedupe contract
// and acknowledge flow against the real store. Also serves as the regression
// test for R-BUG-005 (Supabase used to receive duplicate warning rows on
// every trade).

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

describe('store: risk warning lifecycle', () => {
  it('I-RSK-INT-001: a single-stock trade triggers LACK_OF_DIVERSIFICATION', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy);
    const warnings = useSimulatorStore.getState().warnings;
    expect(
      warnings.some((w) => w.type === 'LACK_OF_DIVERSIFICATION'),
    ).toBe(true);
  });

  it('I-RSK-INT-002 (R-BUG-005): second trade with same trigger does NOT duplicate', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy1 = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy1);

    const beforeCount = useSimulatorStore.getState().warnings.length;
    const buy2 = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy2);
    const afterCount = useSimulatorStore.getState().warnings.length;

    // Still 1 holding → same LACK_OF_DIVERSIFICATION trigger → no new row
    expect(afterCount).toBe(beforeCount);
  });

  it('I-RSK-INT-003: acknowledgeWarning flips acknowledged=true', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy);

    const w = useSimulatorStore.getState().warnings[0];
    expect(w.acknowledged).toBe(false);
    useSimulatorStore.getState().acknowledgeWarning(w.id);
    const after = useSimulatorStore.getState().warnings.find((x) => x.id === w.id);
    expect(after?.acknowledged).toBe(true);
  });

  it('I-RSK-INT-004: acknowledged warning re-fires after fresh trigger', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();

    // Trigger + acknowledge
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy);
    const firstWarning = useSimulatorStore.getState().warnings[0];
    useSimulatorStore.getState().acknowledgeWarning(firstWarning.id);

    // Sell to clear, buy again — same trigger should re-add a new row
    const sell = await useSimulatorStore
      .getState()
      .previewSell({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeSell(sell);
    const buy2 = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy2);

    const active = useSimulatorStore
      .getState()
      .warnings.filter((w) => !w.acknowledged);
    expect(active.length).toBeGreaterThan(0);
  });
});
