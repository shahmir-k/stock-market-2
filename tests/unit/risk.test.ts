// Risk warning detection — covers all 7 triggers from PRD §12.3 + the
// novelWarnings dedupe contract from PRD §24.10. The dedupe behavior is
// also the regression test for R-BUG-005 (Supabase was filling up with
// duplicate LACK_OF_DIVERSIFICATION rows because the persist loop iterated
// `fresh` instead of `novel`).

import { describe, expect, it } from 'vitest';

import {
  dedupeWarnings,
  evaluatePostTradeWarnings,
  evaluatePreTradeWarnings,
  novelWarnings,
} from '@/lib/risk';
import type { Holding, Portfolio, RiskWarning, Transaction } from '@/types/portfolio';
import type { TradePreview } from '@/types/trading';

// ----- Fixtures ------------------------------------------------------------

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

function portfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    cashCad: 5000,
    startingBalanceCad: 5000,
    holdings: [],
    transactions: [],
    snapshots: [],
    realizedGainLossCad: 0,
    ...overrides,
  };
}

function buyPreview(overrides: Partial<TradePreview> = {}): TradePreview {
  return {
    id: `prev-${Math.random()}`,
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
    estimatedCashAfterCad: 4900,
    quoteTimestamp: '2026-05-15T00:00:00Z',
    warnings: [],
    purchaseDate: '2026-05-15',
    isTimeTraveled: false,
    ...overrides,
  };
}

function sellPreview(overrides: Partial<TradePreview> = {}): TradePreview {
  return {
    ...buyPreview(),
    type: 'SELL',
    estimatedCashAfterCad: 5100,
    estimatedRealizedGainLossCad: 0,
    ...overrides,
  };
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  const today = new Date().toISOString();
  return {
    id: `tx-${Math.random()}`,
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
    quoteTimestamp: today,
    timestamp: today,
    purchaseDate: today.slice(0, 10),
    isTimeTraveled: false,
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
    createdAt: new Date().toISOString(),
    acknowledged: false,
    ...overrides,
  };
}

// ===========================================================================
// PRE-TRADE WARNINGS
// ===========================================================================

describe('evaluatePreTradeWarnings — BUY', () => {
  it('U-RSK-001: CONCENTRATION_SINGLE_STOCK fires when post-buy >50%', () => {
    // Buy $3000 of AAPL on a $5000 cash portfolio → 60% concentration
    const p = portfolio({ cashCad: 5000, holdings: [] });
    const preview = buyPreview({
      symbol: 'AAPL',
      quantity: 30,
      priceCad: 100,
      totalCad: 3000,
      estimatedCashAfterCad: 2000,
    });
    const warnings = evaluatePreTradeWarnings(p, preview);
    const concentration = warnings.find(
      (w) => w.type === 'CONCENTRATION_SINGLE_STOCK',
    );
    expect(concentration).toBeDefined();
    expect(concentration?.severity).toBe('HIGH');
    expect(concentration?.relatedSymbol).toBe('AAPL');
    expect(concentration?.relatedLearningSlugs).toContain('concentration-risk');
  });

  it('U-RSK-002: does NOT fire at exactly 50%', () => {
    // Buy $2500 → exactly 50% (50% is the boundary; strict `> 50` doesn't fire)
    const p = portfolio({ cashCad: 5000, holdings: [] });
    const preview = buyPreview({
      symbol: 'AAPL',
      quantity: 25,
      priceCad: 100,
      totalCad: 2500,
      estimatedCashAfterCad: 2500,
    });
    const warnings = evaluatePreTradeWarnings(p, preview);
    expect(
      warnings.some((w) => w.type === 'CONCENTRATION_SINGLE_STOCK'),
    ).toBe(false);
  });

  it('U-RSK-003: NO_CASH_RESERVE fires when remaining cash <1%', () => {
    // Buy $4970 of AAPL → leaves $30 cash on $5000 → 0.6% cash reserve
    const p = portfolio({ cashCad: 5000, holdings: [] });
    const preview = buyPreview({
      symbol: 'AAPL',
      quantity: 49.7,
      priceCad: 100,
      totalCad: 4970,
      estimatedCashAfterCad: 30,
    });
    const warnings = evaluatePreTradeWarnings(p, preview);
    const noCash = warnings.find((w) => w.type === 'NO_CASH_RESERVE');
    expect(noCash).toBeDefined();
    expect(noCash?.severity).toBe('MEDIUM');
  });

  it('NO_CASH_RESERVE does NOT fire when cash reserve ≥1%', () => {
    const p = portfolio({ cashCad: 5000, holdings: [] });
    const preview = buyPreview({
      symbol: 'AAPL',
      quantity: 10,
      priceCad: 100,
      totalCad: 1000,
      estimatedCashAfterCad: 4000,
    });
    const warnings = evaluatePreTradeWarnings(p, preview);
    expect(warnings.some((w) => w.type === 'NO_CASH_RESERVE')).toBe(false);
  });

  it('handles adding to existing holding when computing projected concentration', () => {
    // Already own 10 shares of AAPL @ $100 = $1000 (20% of $5k)
    // Buy 30 more @ $100 = $3000 more → existing $1000 + buy $3000 = $4000 of AAPL → 80%
    const existing = holding({
      symbol: 'AAPL',
      quantity: 10,
      currentPriceCad: 100,
      averageCostCad: 100,
    });
    const p = portfolio({ cashCad: 4000, holdings: [existing] });
    const preview = buyPreview({
      symbol: 'AAPL',
      quantity: 30,
      priceCad: 100,
      totalCad: 3000,
      estimatedCashAfterCad: 1000,
    });
    const warnings = evaluatePreTradeWarnings(p, preview);
    expect(
      warnings.some((w) => w.type === 'CONCENTRATION_SINGLE_STOCK'),
    ).toBe(true);
  });
});

describe('evaluatePreTradeWarnings — SELL', () => {
  it('U-RSK-004: PANIC_SELLING fires when current price ≥5% below avg cost', () => {
    const owned = holding({
      symbol: 'AAPL',
      quantity: 5,
      averageCostCad: 100,
      currentPriceCad: 94, // 6% below avg
    });
    const p = portfolio({ cashCad: 1000, holdings: [owned] });
    const preview = sellPreview({
      symbol: 'AAPL',
      quantity: 5,
      priceCad: 94,
      priceNative: 94,
      totalCad: 470,
    });
    const warnings = evaluatePreTradeWarnings(p, preview);
    const panic = warnings.find((w) => w.type === 'PANIC_SELLING');
    expect(panic).toBeDefined();
    expect(panic?.severity).toBe('MEDIUM');
    expect(panic?.relatedSymbol).toBe('AAPL');
  });

  it('PANIC_SELLING does NOT fire when drop <5%', () => {
    const owned = holding({
      symbol: 'AAPL',
      quantity: 5,
      averageCostCad: 100,
      currentPriceCad: 97, // 3% below avg
    });
    const p = portfolio({ cashCad: 1000, holdings: [owned] });
    const preview = sellPreview({
      symbol: 'AAPL',
      quantity: 5,
      priceCad: 97,
      priceNative: 97,
      totalCad: 485,
    });
    const warnings = evaluatePreTradeWarnings(p, preview);
    expect(warnings.some((w) => w.type === 'PANIC_SELLING')).toBe(false);
  });

  it('PANIC_SELLING does NOT fire on profitable sells', () => {
    const owned = holding({
      symbol: 'AAPL',
      quantity: 5,
      averageCostCad: 100,
      currentPriceCad: 130,
    });
    const p = portfolio({ cashCad: 1000, holdings: [owned] });
    const preview = sellPreview({ priceCad: 130, totalCad: 650 });
    const warnings = evaluatePreTradeWarnings(p, preview);
    expect(warnings.some((w) => w.type === 'PANIC_SELLING')).toBe(false);
  });
});

// ===========================================================================
// POST-TRADE WARNINGS
// ===========================================================================

describe('evaluatePostTradeWarnings', () => {
  it('U-RSK-005: CONCENTRATION_SECTOR fires when one sector >70%', () => {
    // Two holdings, both Technology — together $4000 of $5000 = 80%
    const apple = holding({
      symbol: 'AAPL',
      sector: 'Technology',
      quantity: 30,
      averageCostCad: 100,
      currentPriceCad: 100,
    });
    const msft = holding({
      symbol: 'MSFT',
      sector: 'Technology',
      quantity: 10,
      averageCostCad: 100,
      currentPriceCad: 100,
    });
    const p = portfolio({ cashCad: 1000, holdings: [apple, msft] });
    const warnings = evaluatePostTradeWarnings(p);
    const sectorWarn = warnings.find((w) => w.type === 'CONCENTRATION_SECTOR');
    expect(sectorWarn).toBeDefined();
    expect(sectorWarn?.severity).toBe('MEDIUM');
  });

  it('U-RSK-006: LACK_OF_DIVERSIFICATION fires when exactly 1 holding', () => {
    const p = portfolio({ holdings: [holding()] });
    const warnings = evaluatePostTradeWarnings(p);
    const lack = warnings.find((w) => w.type === 'LACK_OF_DIVERSIFICATION');
    expect(lack).toBeDefined();
    expect(lack?.severity).toBe('LOW');
  });

  it('LACK_OF_DIVERSIFICATION does NOT fire with 2+ holdings', () => {
    const p = portfolio({
      holdings: [
        holding({ symbol: 'AAPL' }),
        holding({ symbol: 'MSFT' }),
      ],
    });
    const warnings = evaluatePostTradeWarnings(p);
    expect(
      warnings.some((w) => w.type === 'LACK_OF_DIVERSIFICATION'),
    ).toBe(false);
  });

  it('U-RSK-007: OVERTRADING fires at >5 trades today', () => {
    const today = new Date().toISOString();
    const transactions = Array.from({ length: 6 }, (_, i) =>
      tx({ id: `t-${i}`, timestamp: today }),
    );
    const p = portfolio({
      holdings: [holding()],
      transactions,
    });
    const warnings = evaluatePostTradeWarnings(p);
    const over = warnings.find((w) => w.type === 'OVERTRADING');
    expect(over).toBeDefined();
    expect(over?.severity).toBe('INFO');
  });

  it('OVERTRADING does NOT fire with ≤5 trades today', () => {
    const today = new Date().toISOString();
    const transactions = Array.from({ length: 5 }, (_, i) =>
      tx({ id: `t-${i}`, timestamp: today }),
    );
    const p = portfolio({
      holdings: [holding()],
      transactions,
    });
    const warnings = evaluatePostTradeWarnings(p);
    expect(warnings.some((w) => w.type === 'OVERTRADING')).toBe(false);
  });

  it('OVERTRADING ignores trades from previous days', () => {
    const yesterday = '2020-01-01T00:00:00Z'; // definitely not today
    const transactions = Array.from({ length: 10 }, (_, i) =>
      tx({ id: `t-${i}`, timestamp: yesterday }),
    );
    const p = portfolio({
      holdings: [holding()],
      transactions,
    });
    const warnings = evaluatePostTradeWarnings(p);
    expect(warnings.some((w) => w.type === 'OVERTRADING')).toBe(false);
  });

  it('U-RSK-008: PERFORMANCE_CHASING fires when last buy ≥5% above avg', () => {
    const today = new Date().toISOString();
    const h = holding({
      symbol: 'AAPL',
      averageCostCad: 100,
      currentPriceCad: 110,
    });
    const lastTx = tx({
      type: 'BUY',
      symbol: 'AAPL',
      priceCad: 110, // 10% above avg → fires
      timestamp: today,
    });
    const p = portfolio({
      cashCad: 1000,
      holdings: [h],
      transactions: [lastTx],
    });
    const warnings = evaluatePostTradeWarnings(p);
    const chase = warnings.find((w) => w.type === 'PERFORMANCE_CHASING');
    expect(chase).toBeDefined();
    expect(chase?.severity).toBe('INFO');
  });

  it('U-RSK-015: empty portfolio returns no warnings', () => {
    const warnings = evaluatePostTradeWarnings(portfolio());
    expect(warnings).toEqual([]);
  });

  it('U-RSK-013: warnings carry correct severity per PRD §12.3', () => {
    // Build a portfolio that triggers multiple warnings and check each severity
    const today = new Date().toISOString();
    const h = holding({ symbol: 'AAPL', quantity: 40, currentPriceCad: 100 }); // 80% in AAPL
    const p = portfolio({
      cashCad: 1000,
      holdings: [h],
      transactions: [
        tx({ id: 't1', timestamp: today, priceCad: 100 }),
      ],
    });
    const warnings = evaluatePostTradeWarnings(p);
    const bySeverity = warnings.reduce<Record<string, RiskWarning['severity']>>(
      (acc, w) => ({ ...acc, [w.type]: w.severity }),
      {},
    );
    expect(bySeverity.CONCENTRATION_SINGLE_STOCK).toBe('HIGH');
    expect(bySeverity.LACK_OF_DIVERSIFICATION).toBe('LOW');
  });

  it('U-RSK-014: every warning has a unique id', () => {
    const today = new Date().toISOString();
    const transactions = Array.from({ length: 10 }, (_, i) =>
      tx({ id: `t-${i}`, timestamp: today }),
    );
    const p = portfolio({
      holdings: [
        holding({ symbol: 'AAPL', quantity: 40, currentPriceCad: 100 }),
      ],
      cashCad: 1000,
      transactions,
    });
    const warnings = evaluatePostTradeWarnings(p);
    const ids = warnings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('U-RSK-012: warning relatedLearningSlugs match PRD §12.3', () => {
    const today = new Date().toISOString();
    const p = portfolio({
      cashCad: 1000,
      holdings: [
        holding({ symbol: 'AAPL', quantity: 40, currentPriceCad: 100 }),
      ],
      transactions: [tx({ timestamp: today })],
    });
    const warnings = evaluatePostTradeWarnings(p);
    const conc = warnings.find((w) => w.type === 'CONCENTRATION_SINGLE_STOCK');
    expect(conc?.relatedLearningSlugs).toEqual([
      'concentration-risk',
      'diversification',
    ]);
  });
});

// ===========================================================================
// DEDUPLICATION — regression for R-BUG-005
// ===========================================================================

describe('novelWarnings (R-BUG-005 regression)', () => {
  it('U-RSK-009: filters out warnings that match an active existing warning', () => {
    const existing = [
      warning({ type: 'LACK_OF_DIVERSIFICATION', acknowledged: false }),
    ];
    const fresh = [warning({ type: 'LACK_OF_DIVERSIFICATION' })];
    const novel = novelWarnings(existing, fresh);
    expect(novel).toEqual([]);
  });

  it('U-RSK-010: re-emits a warning whose previous instance was acknowledged', () => {
    const existing = [
      warning({ type: 'LACK_OF_DIVERSIFICATION', acknowledged: true }),
    ];
    const fresh = [warning({ type: 'LACK_OF_DIVERSIFICATION' })];
    const novel = novelWarnings(existing, fresh);
    expect(novel.length).toBe(1);
  });

  it('keys dedupe on type + relatedSymbol (PRD §24.10)', () => {
    const existing = [
      warning({
        type: 'CONCENTRATION_SINGLE_STOCK',
        relatedSymbol: 'AAPL',
        acknowledged: false,
      }),
    ];
    const fresh = [
      warning({
        type: 'CONCENTRATION_SINGLE_STOCK',
        relatedSymbol: 'AAPL',
      }),
      warning({
        type: 'CONCENTRATION_SINGLE_STOCK',
        relatedSymbol: 'MSFT',
      }),
    ];
    const novel = novelWarnings(existing, fresh);
    // AAPL warning filtered out; MSFT warning kept
    expect(novel.length).toBe(1);
    expect(novel[0].relatedSymbol).toBe('MSFT');
  });

  it('treats missing relatedSymbol as ""', () => {
    // OVERTRADING and LACK_OF_DIVERSIFICATION have no relatedSymbol
    const existing = [
      warning({ type: 'OVERTRADING', relatedSymbol: undefined }),
    ];
    const fresh = [warning({ type: 'OVERTRADING' })];
    const novel = novelWarnings(existing, fresh);
    expect(novel).toEqual([]);
  });

  it('U-RSK-011: dedupeWarnings returns existing + novel concatenated', () => {
    const existing = [warning({ id: 'old-1', type: 'OVERTRADING' })];
    const fresh = [warning({ id: 'new-1', type: 'LACK_OF_DIVERSIFICATION' })];
    const merged = dedupeWarnings(existing, fresh);
    expect(merged.length).toBe(2);
    expect(merged[0].id).toBe('old-1');
    expect(merged[1].id).toBe('new-1');
  });
});
