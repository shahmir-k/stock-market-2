// Selector memoization tests — regression for R-BUG-001 (the dashboard
// infinite-render loop caused by `selectRecentTransactions` and friends
// returning a new array reference on every call). These selectors must
// return a stable === reference when their input slice is unchanged so
// React 19 + Zustand v5's useSyncExternalStore doesn't loop.

import { describe, expect, it } from 'vitest';

import {
  selectAcknowledgedWarnings,
  selectActiveWarnings,
  selectDiversificationResult,
  selectHoldingsWithAnalytics,
  selectInvestedValueCad,
  selectPortfolioValueCad,
  selectRecentTransactions,
  selectTotalReturnCad,
  selectTotalReturnPercent,
  type SimulatorStoreState,
} from '@/store/simulatorStore';
import type {
  Holding,
  Portfolio,
  RiskWarning,
  Transaction,
} from '@/types/portfolio';

function holding(overrides: Partial<Holding> = {}): Holding {
  return {
    symbol: 'AAPL',
    assetName: 'Apple Inc.',
    assetType: 'STOCK',
    sector: 'Technology',
    quantity: 1,
    averageCostCad: 100,
    currentPriceNative: 100,
    currentPriceCad: 100,
    nativeCurrency: 'CAD',
    fxRateToCad: 1,
    lastQuoteAt: '2026-05-15T00:00:00Z',
    ...overrides,
  };
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `t-${Math.random()}`,
    type: 'BUY',
    symbol: 'AAPL',
    assetName: 'Apple Inc.',
    assetType: 'STOCK',
    quantity: 1,
    priceNative: 100,
    nativeCurrency: 'CAD',
    fxRateToCad: 1,
    priceCad: 100,
    totalCad: 100,
    quoteTimestamp: '2026-05-15T00:00:00Z',
    timestamp: '2026-05-15T00:00:00Z',
    ...overrides,
  };
}

function warning(overrides: Partial<RiskWarning> = {}): RiskWarning {
  return {
    id: `w-${Math.random()}`,
    type: 'LACK_OF_DIVERSIFICATION',
    severity: 'LOW',
    title: 'Lack of diversification',
    message: '',
    relatedLearningSlugs: [],
    createdAt: '2026-05-15T00:00:00Z',
    acknowledged: false,
    ...overrides,
  };
}

function portfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    cashCad: 5000,
    startingBalanceCad: 5000,
    realizedGainLossCad: 0,
    holdings: [],
    transactions: [],
    snapshots: [],
    ...overrides,
  };
}

// Build the minimum store-state shape needed by the selectors under test.
function makeState(
  portfolioOverrides: Partial<Portfolio> = {},
  warnings: RiskWarning[] = [],
): SimulatorStoreState {
  return {
    version: 1,
    user: null,
    simulation: {
      startingBalanceCad: 5000,
      baseCurrency: 'CAD',
      allowFractionalShares: true,
      allowCrypto: false,
      allowOptions: false,
      allowMargin: false,
      allowShortSelling: false,
    },
    portfolio: portfolio(portfolioOverrides),
    warnings,
    marketDataMode: 'API',
    fxRateUsdCad: 1.35,
    isHydrated: true,
    recoveryNeeded: false,
    portfolioId: null,
    authSessionStatus: 'UNAUTHENTICATED',
    syncStatus: 'SYNCED',
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
  } as unknown as SimulatorStoreState;
}

// ===========================================================================
// MEMOIZATION (R-BUG-001 regression)
// ===========================================================================

describe('selectHoldingsWithAnalytics — memoization', () => {
  it('U-SEL-003: returns the SAME reference across consecutive calls on identical state', () => {
    const state = makeState({ holdings: [holding({ symbol: 'AAPL' })] });
    const r1 = selectHoldingsWithAnalytics(state);
    const r2 = selectHoldingsWithAnalytics(state);
    expect(r2).toBe(r1); // same reference, not just same content
  });

  it('U-SEL-008: recomputes when the portfolio reference changes', () => {
    const state1 = makeState({ holdings: [holding({ symbol: 'AAPL' })] });
    const r1 = selectHoldingsWithAnalytics(state1);
    const state2 = makeState({
      holdings: [holding({ symbol: 'AAPL' }), holding({ symbol: 'MSFT' })],
    });
    const r2 = selectHoldingsWithAnalytics(state2);
    expect(r2).not.toBe(r1);
    expect(r2.length).toBe(2);
  });
});

describe('selectRecentTransactions — memoization', () => {
  it('U-SEL-004: same reference across consecutive calls', () => {
    const state = makeState({ transactions: [tx({ id: 't1' }), tx({ id: 't2' })] });
    const r1 = selectRecentTransactions(state);
    const r2 = selectRecentTransactions(state);
    expect(r2).toBe(r1);
  });

  it('returns transactions newest-first (reversed)', () => {
    const t1 = tx({ id: 't1', timestamp: '2026-01-01T00:00:00Z' });
    const t2 = tx({ id: 't2', timestamp: '2026-01-02T00:00:00Z' });
    const state = makeState({ transactions: [t1, t2] }); // t1 first
    const reversed = selectRecentTransactions(state);
    expect(reversed[0].id).toBe('t2'); // newest first
    expect(reversed[1].id).toBe('t1');
  });
});

describe('selectActiveWarnings — memoization', () => {
  it('U-SEL-005: same reference across consecutive calls', () => {
    const state = makeState({}, [warning({ acknowledged: false })]);
    const r1 = selectActiveWarnings(state);
    const r2 = selectActiveWarnings(state);
    expect(r2).toBe(r1);
  });

  it('filters out acknowledged warnings', () => {
    const state = makeState({}, [
      warning({ id: 'w1', acknowledged: false }),
      warning({ id: 'w2', acknowledged: true }),
    ]);
    const active = selectActiveWarnings(state);
    expect(active.length).toBe(1);
    expect(active[0].id).toBe('w1');
  });
});

describe('selectAcknowledgedWarnings — memoization', () => {
  it('U-SEL-006: same reference across consecutive calls', () => {
    const state = makeState({}, [warning({ acknowledged: true })]);
    const r1 = selectAcknowledgedWarnings(state);
    const r2 = selectAcknowledgedWarnings(state);
    expect(r2).toBe(r1);
  });
});

describe('selectDiversificationResult — memoization', () => {
  it('U-SEL-007: same reference across consecutive calls', () => {
    const state = makeState({ holdings: [holding()] });
    const r1 = selectDiversificationResult(state);
    const r2 = selectDiversificationResult(state);
    expect(r2).toBe(r1);
  });
});

// ===========================================================================
// SELECTOR CORRECTNESS
// ===========================================================================

describe('Numeric selectors (no memoization needed — primitives)', () => {
  it('U-SEL-009: selectTotalReturnCad matches portfolioValue - starting', () => {
    const state = makeState({
      cashCad: 4000,
      startingBalanceCad: 5000,
      holdings: [
        holding({ quantity: 10, currentPriceCad: 150 }), // $1500 invested
      ],
    });
    // portfolio value = 4000 + 1500 = 5500
    // return = 5500 - 5000 = 500
    expect(selectPortfolioValueCad(state)).toBe(5500);
    expect(selectInvestedValueCad(state)).toBe(1500);
    expect(selectTotalReturnCad(state)).toBe(500);
    expect(selectTotalReturnPercent(state)).toBe(10);
  });
});
