// Time-travel integration test against the real Zustand store + mock provider.
// Mirrors the storeFlows.test.ts pattern (jsdom env, marketDataMode forced
// to MOCK, Supabase client mocked away).

// @vitest-environment jsdom
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

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

describe('time-travel buy', () => {
  it('previewBuy with a back-dated purchaseDate uses the historical close, not today’s mock quote', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation('Tester');

    const purchaseDate = isoDaysAgo(500);
    const liveQuote = await useSimulatorStore
      .getState()
      .getQuote('AAPL');
    const preview = await useSimulatorStore.getState().previewBuy({
      symbol: 'AAPL',
      quantity: 1,
      purchaseDate,
    });

    expect(preview.isTimeTraveled).toBe(true);
    expect(preview.purchaseDate).toBe(purchaseDate);
    // Historical close should differ from today's mock basePrice for AAPL.
    expect(preview.priceNative).not.toBe(liveQuote.priceNative);
  });

  it('cash deducted = qty × histClose × histFx for a USD asset', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();

    const purchaseDate = isoDaysAgo(800);
    const hq = await useSimulatorStore
      .getState()
      .getHistoricalQuoteAt('AAPL', purchaseDate);
    const fx = await useSimulatorStore
      .getState()
      .getHistoricalFxAt('USD', 'CAD', purchaseDate);
    const expectedTotal = 2 * hq.closeNative * fx.rate;

    const cashBefore = useSimulatorStore.getState().portfolio.cashCad;
    const preview = await useSimulatorStore.getState().previewBuy({
      symbol: 'AAPL',
      quantity: 2,
      purchaseDate,
    });
    const exec = await useSimulatorStore.getState().executeBuy(preview);
    expect(exec.success).toBe(true);
    const cashAfter = useSimulatorStore.getState().portfolio.cashCad;
    expect(cashBefore - cashAfter).toBeCloseTo(expectedTotal, 4);
  });

  it('first back-dated buy sets holding.firstPurchaseDate', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();

    const purchaseDate = isoDaysAgo(500);
    const preview = await useSimulatorStore.getState().previewBuy({
      symbol: 'TD.TO',
      quantity: 1,
      purchaseDate,
    });
    await useSimulatorStore.getState().executeBuy(preview);
    const holding = useSimulatorStore
      .getState()
      .portfolio.holdings.find((h) => h.symbol === 'TD.TO')!;
    expect(holding.firstPurchaseDate).toBe(purchaseDate);
  });

  it('a later buy with an earlier date moves firstPurchaseDate earlier', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();

    const recent = isoDaysAgo(200);
    const earlier = isoDaysAgo(2000);

    let preview = await useSimulatorStore.getState().previewBuy({
      symbol: 'TD.TO',
      quantity: 1,
      purchaseDate: recent,
    });
    await useSimulatorStore.getState().executeBuy(preview);

    preview = await useSimulatorStore.getState().previewBuy({
      symbol: 'TD.TO',
      quantity: 1,
      purchaseDate: earlier,
    });
    await useSimulatorStore.getState().executeBuy(preview);

    const holding = useSimulatorStore
      .getState()
      .portfolio.holdings.find((h) => h.symbol === 'TD.TO')!;
    expect(holding.firstPurchaseDate).toBe(earlier);
  });
});

describe('time-travel sell — first-purchase gate', () => {
  it('previewSell before firstPurchaseDate throws BEFORE_FIRST_PURCHASE', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    const { TradeValidationError } = await import('@/lib/trading/errors');
    await useSimulatorStore.getState().initializeSimulation();

    const buyDate = isoDaysAgo(500);
    const tooEarly = isoDaysAgo(2000);

    await useSimulatorStore.getState().executeBuy(
      await useSimulatorStore.getState().previewBuy({
        symbol: 'TD.TO',
        quantity: 2,
        purchaseDate: buyDate,
      }),
    );

    let caught: unknown;
    try {
      await useSimulatorStore.getState().previewSell({
        symbol: 'TD.TO',
        quantity: 1,
        purchaseDate: tooEarly,
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(TradeValidationError);
    expect((caught as { code?: string }).code).toBe('BEFORE_FIRST_PURCHASE');
  });

  it('previewSell on/after firstPurchaseDate succeeds', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();

    const buyDate = isoDaysAgo(500);
    const sellDate = isoDaysAgo(100);

    await useSimulatorStore.getState().executeBuy(
      await useSimulatorStore.getState().previewBuy({
        symbol: 'TD.TO',
        quantity: 2,
        purchaseDate: buyDate,
      }),
    );

    const sellPreview = await useSimulatorStore.getState().previewSell({
      symbol: 'TD.TO',
      quantity: 1,
      purchaseDate: sellDate,
    });
    expect(sellPreview.purchaseDate).toBe(sellDate);
    expect(sellPreview.isTimeTraveled).toBe(true);
  });
});

// Regression guard: slider-at-Today must be byte-identical to the legacy path.
describe('regression: today path is untouched', () => {
  it('previewBuy without purchaseDate matches previewBuy with purchaseDate = today', async () => {
    const { useSimulatorStore } = await import('@/store/simulatorStore');
    await useSimulatorStore.getState().initializeSimulation();

    const today = new Date().toISOString().slice(0, 10);
    const aNoDate = await useSimulatorStore.getState().previewBuy({
      symbol: 'TD.TO',
      quantity: 1,
    });
    const bToday = await useSimulatorStore.getState().previewBuy({
      symbol: 'TD.TO',
      quantity: 1,
      purchaseDate: today,
    });

    // Compare semantically — `id` and `warnings` may differ between calls.
    const strip = (p: typeof aNoDate) => ({
      type: p.type,
      symbol: p.symbol,
      quantity: p.quantity,
      priceNative: p.priceNative,
      nativeCurrency: p.nativeCurrency,
      fxRateToCad: p.fxRateToCad,
      priceCad: p.priceCad,
      totalCad: p.totalCad,
      estimatedCashAfterCad: p.estimatedCashAfterCad,
      purchaseDate: p.purchaseDate,
      isTimeTraveled: p.isTimeTraveled,
      actualPriceDate: p.actualPriceDate,
      fxRateDate: p.fxRateDate,
    });
    expect(strip(aNoDate)).toEqual(strip(bToday));
    expect(aNoDate.isTimeTraveled).toBe(false);
    expect(bToday.isTimeTraveled).toBe(false);
  });
});
