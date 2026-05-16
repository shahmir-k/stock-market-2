// @vitest-environment jsdom

// Reset preservation rules per PRD §24.7 + §34.10:
//   - Cash → 5000, realized G/L → 0
//   - Holdings, transactions, snapshots (except initial), warnings cleared
//   - Display name + market data mode + learning_progress preserved

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

describe('store: resetSimulation preservation rules (PRD §24.7)', () => {
  it('I-RST-002: preserves display name', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation('Acme Investor');
    await useSimulatorStore.getState().resetSimulation();
    expect(useSimulatorStore.getState().user?.displayName).toBe('Acme Investor');
  });

  it('I-RST-003: preserves market data mode', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    useSimulatorStore.setState((s) => ({ ...s, marketDataMode: 'MOCK' }));
    await useSimulatorStore.getState().resetSimulation();
    expect(useSimulatorStore.getState().marketDataMode).toBe('MOCK');
  });

  it('I-RST-004: clears warnings array', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy);
    expect(useSimulatorStore.getState().warnings.length).toBeGreaterThan(0);

    await useSimulatorStore.getState().resetSimulation();
    expect(useSimulatorStore.getState().warnings.length).toBe(0);
  });

  it('I-RST-005: appends fresh initial snapshot', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeBuy(buy);
    await useSimulatorStore.getState().resetSimulation();

    const snapshots = useSimulatorStore.getState().portfolio.snapshots;
    expect(snapshots.length).toBeGreaterThanOrEqual(1);
    expect(snapshots[snapshots.length - 1].totalValueCad).toBe(5000);
  });

  it('resets realized G/L to 0', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();
    const buy = await useSimulatorStore
      .getState()
      .previewBuy({ symbol: 'TD.TO', quantity: 2 });
    await useSimulatorStore.getState().executeBuy(buy);
    const sell = await useSimulatorStore
      .getState()
      .previewSell({ symbol: 'TD.TO', quantity: 1 });
    await useSimulatorStore.getState().executeSell(sell);

    await useSimulatorStore.getState().resetSimulation();
    expect(useSimulatorStore.getState().portfolio.realizedGainLossCad).toBe(0);
  });
});
