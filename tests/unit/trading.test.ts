import { describe, expect, it } from 'vitest';

import { applyBuy, applySell } from '@/lib/trading/apply';
import { buildBuyPreview } from '@/lib/trading/buy';
import { TradeValidationError } from '@/lib/trading/errors';
import { buildSellPreview } from '@/lib/trading/sell';
import type { QuoteResponseData } from '@/types/market';
import type { Portfolio } from '@/types/portfolio';

const cadQuote = (overrides: Partial<QuoteResponseData> = {}): QuoteResponseData => ({
  symbol: 'TD.TO',
  name: 'TD',
  assetType: 'STOCK',
  exchange: 'TSX',
  currency: 'CAD',
  priceNative: 100,
  quoteTimestamp: '2026-05-15T00:00:00Z',
  freshness: 'FRESH',
  ...overrides,
});

const emptyPortfolio = (): Portfolio => ({
  cashCad: 5000,
  startingBalanceCad: 5000,
  holdings: [],
  transactions: [],
  snapshots: [],
  realizedGainLossCad: 0,
});

describe('buildBuyPreview', () => {
  it('rejects qty ≤ 0', () => {
    expect(() =>
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: 0 },
        quote: cadQuote(),
        fxRate: 1,
        currentCashCad: 5000,
      }),
    ).toThrow(TradeValidationError);
  });

  it('rejects insufficient cash', () => {
    expect(() =>
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: 100 },
        quote: cadQuote({ priceNative: 100 }),
        fxRate: 1,
        currentCashCad: 50,
      }),
    ).toThrow(TradeValidationError);
  });

  it('builds preview with totalCad and cashAfter', () => {
    const p = buildBuyPreview({
      order: { symbol: 'TD.TO', quantity: 2 },
      quote: cadQuote({ priceNative: 100 }),
      fxRate: 1,
      currentCashCad: 5000,
    });
    expect(p.totalCad).toBe(200);
    expect(p.estimatedCashAfterCad).toBe(4800);
  });

  it('U-TRD-002: rejects NaN qty', () => {
    expect(() =>
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: Number.NaN },
        quote: cadQuote(),
        fxRate: 1,
        currentCashCad: 5000,
      }),
    ).toThrow(TradeValidationError);
  });

  it('U-TRD-005: preview carries quoteTimestamp from input', () => {
    const p = buildBuyPreview({
      order: { symbol: 'TD.TO', quantity: 1 },
      quote: cadQuote({ quoteTimestamp: '2025-06-01T12:00:00Z' }),
      fxRate: 1,
      currentCashCad: 5000,
    });
    expect(p.quoteTimestamp).toBe('2025-06-01T12:00:00Z');
  });
});

describe('applyBuy', () => {
  it('creates new holding + decrements cash + appends snapshot', () => {
    const portfolio = emptyPortfolio();
    const preview = buildBuyPreview({
      order: { symbol: 'TD.TO', quantity: 2 },
      quote: cadQuote({ priceNative: 100 }),
      fxRate: 1,
      currentCashCad: portfolio.cashCad,
    });
    const result = applyBuy(portfolio, preview, '2026-05-15T00:00:00Z');
    expect(result.portfolio.cashCad).toBe(4800);
    expect(result.portfolio.holdings.length).toBe(1);
    expect(result.portfolio.holdings[0].quantity).toBe(2);
    expect(result.portfolio.holdings[0].averageCostCad).toBe(100);
    expect(result.portfolio.transactions.length).toBe(1);
    expect(result.portfolio.snapshots.length).toBe(1);
    expect(result.snapshot.totalValueCad).toBe(5000); // 4800 cash + 200 holdings
  });

  it('updates average cost on additional buy', () => {
    let portfolio = emptyPortfolio();
    const buy1 = buildBuyPreview({
      order: { symbol: 'TD.TO', quantity: 1 },
      quote: cadQuote({ priceNative: 100 }),
      fxRate: 1,
      currentCashCad: portfolio.cashCad,
    });
    portfolio = applyBuy(portfolio, buy1).portfolio;
    const buy2 = buildBuyPreview({
      order: { symbol: 'TD.TO', quantity: 1 },
      quote: cadQuote({ priceNative: 120 }),
      fxRate: 1,
      currentCashCad: portfolio.cashCad,
    });
    portfolio = applyBuy(portfolio, buy2).portfolio;
    expect(portfolio.holdings[0].quantity).toBe(2);
    expect(portfolio.holdings[0].averageCostCad).toBe(110);
  });
});

describe('applySell', () => {
  it('partial sell: keeps avg cost, decrements qty, increments realized G/L', () => {
    let portfolio = emptyPortfolio();
    portfolio = applyBuy(
      portfolio,
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: 2 },
        quote: cadQuote({ priceNative: 100 }),
        fxRate: 1,
        currentCashCad: portfolio.cashCad,
      }),
    ).portfolio;

    const sellPreview = buildSellPreview({
      order: { symbol: 'TD.TO', quantity: 1 },
      quote: cadQuote({ priceNative: 130 }),
      fxRate: 1,
      holding: portfolio.holdings[0],
      currentCashCad: portfolio.cashCad,
    });
    portfolio = applySell(portfolio, sellPreview).portfolio;

    expect(portfolio.holdings[0].quantity).toBe(1);
    expect(portfolio.holdings[0].averageCostCad).toBe(100); // unchanged
    expect(portfolio.realizedGainLossCad).toBe(30); // 1 * (130-100)
    expect(portfolio.cashCad).toBe(4930); // 4800 + 130
  });

  it('full sell removes the holding', () => {
    let portfolio = emptyPortfolio();
    portfolio = applyBuy(
      portfolio,
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: 1 },
        quote: cadQuote({ priceNative: 100 }),
        fxRate: 1,
        currentCashCad: portfolio.cashCad,
      }),
    ).portfolio;
    const sell = buildSellPreview({
      order: { symbol: 'TD.TO', quantity: 1 },
      quote: cadQuote({ priceNative: 100 }),
      fxRate: 1,
      holding: portfolio.holdings[0],
      currentCashCad: portfolio.cashCad,
    });
    portfolio = applySell(portfolio, sell).portfolio;
    expect(portfolio.holdings.length).toBe(0);
  });

  it('U-TRD-008: sell preview populates estimatedRealizedGainLossCad', () => {
    let portfolio = emptyPortfolio();
    portfolio = applyBuy(
      portfolio,
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: 2 },
        quote: cadQuote({ priceNative: 100 }),
        fxRate: 1,
        currentCashCad: portfolio.cashCad,
      }),
    ).portfolio;
    const sp = buildSellPreview({
      order: { symbol: 'TD.TO', quantity: 1 },
      quote: cadQuote({ priceNative: 130 }),
      fxRate: 1,
      holding: portfolio.holdings[0],
      currentCashCad: portfolio.cashCad,
    });
    expect(sp.estimatedRealizedGainLossCad).toBe(30);
  });

  it('U-TRD-018: epsilon-leftover full sell removes holding', () => {
    let portfolio = emptyPortfolio();
    portfolio = applyBuy(
      portfolio,
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: 1.0000005 },
        quote: cadQuote({ priceNative: 100 }),
        fxRate: 1,
        currentCashCad: portfolio.cashCad,
      }),
    ).portfolio;
    const sell = buildSellPreview({
      order: { symbol: 'TD.TO', quantity: 1 },
      quote: cadQuote({ priceNative: 100 }),
      fxRate: 1,
      holding: portfolio.holdings[0],
      currentCashCad: portfolio.cashCad,
    });
    portfolio = applySell(portfolio, sell).portfolio;
    expect(portfolio.holdings.length).toBe(0);
  });

  it('rejects qty > owned', () => {
    expect(() =>
      buildSellPreview({
        order: { symbol: 'TD.TO', quantity: 5 },
        quote: cadQuote({ priceNative: 100 }),
        fxRate: 1,
        holding: {
          symbol: 'TD.TO',
          assetName: 'TD',
          assetType: 'STOCK',
          quantity: 1,
          averageCostCad: 100,
          currentPriceNative: 100,
          currentPriceCad: 100,
          nativeCurrency: 'CAD',
          fxRateToCad: 1,
          lastQuoteAt: '2026-05-15T00:00:00Z',
        },
        currentCashCad: 0,
      }),
    ).toThrow(TradeValidationError);
  });
});

// ---------------------------------------------------------------------------
// Time-travel — historical price + first-purchase gating
// ---------------------------------------------------------------------------

describe('buildBuyPreview — time travel', () => {
  it('historicalQuote drives priceNative instead of live quote', () => {
    const p = buildBuyPreview({
      order: { symbol: 'TD.TO', quantity: 2, purchaseDate: '2020-01-02' },
      quote: cadQuote({ priceNative: 100 }),
      historicalQuote: {
        symbol: 'TD.TO',
        date: '2020-01-02',
        actualDate: '2020-01-02',
        closeNative: 50,
        openNative: 50,
        highNative: 51,
        lowNative: 49,
        currency: 'CAD',
      },
      fxRate: 1,
      currentCashCad: 5000,
    });
    expect(p.priceNative).toBe(50);
    expect(p.totalCad).toBe(100); // 2 × 50
    expect(p.purchaseDate).toBe('2020-01-02');
    expect(p.isTimeTraveled).toBe(true);
    expect(p.actualPriceDate).toBe('2020-01-02');
    expect(p.fxRateDate).toBe('2020-01-02');
  });

  it('today path (no historicalQuote, no order.purchaseDate) is byte-identical to legacy', () => {
    const p = buildBuyPreview({
      order: { symbol: 'TD.TO', quantity: 2 },
      quote: cadQuote({ priceNative: 100 }),
      fxRate: 1,
      currentCashCad: 5000,
    });
    expect(p.isTimeTraveled).toBe(false);
    expect(p.purchaseDate).toBe(new Date().toISOString().slice(0, 10));
    expect(p.actualPriceDate).toBeUndefined();
    expect(p.fxRateDate).toBeUndefined();
  });
});

describe('buildSellPreview — time travel + firstPurchaseDate gate', () => {
  const heldFrom2020 = {
    symbol: 'TD.TO',
    assetName: 'TD',
    assetType: 'STOCK' as const,
    quantity: 10,
    averageCostCad: 100,
    currentPriceNative: 120,
    currentPriceCad: 120,
    nativeCurrency: 'CAD',
    fxRateToCad: 1,
    lastQuoteAt: '2026-05-15T00:00:00Z',
    firstPurchaseDate: '2020-01-02',
  };

  it('rejects sell with purchaseDate < firstPurchaseDate', () => {
    expect(() =>
      buildSellPreview({
        order: { symbol: 'TD.TO', quantity: 1, purchaseDate: '2019-06-01' },
        quote: cadQuote({ priceNative: 120 }),
        fxRate: 1,
        holding: heldFrom2020,
        currentCashCad: 0,
      }),
    ).toThrow(TradeValidationError);
  });

  it('accepts sell at the boundary (purchaseDate === firstPurchaseDate)', () => {
    const p = buildSellPreview({
      order: { symbol: 'TD.TO', quantity: 1, purchaseDate: '2020-01-02' },
      quote: cadQuote({ priceNative: 120 }),
      historicalQuote: {
        symbol: 'TD.TO',
        date: '2020-01-02',
        actualDate: '2020-01-02',
        closeNative: 70,
        openNative: 70,
        highNative: 71,
        lowNative: 69,
        currency: 'CAD',
      },
      fxRate: 1,
      holding: heldFrom2020,
      currentCashCad: 0,
    });
    expect(p.purchaseDate).toBe('2020-01-02');
    expect(p.priceNative).toBe(70);
  });
});

describe('applyBuy — firstPurchaseDate invariant', () => {
  function emptyPortfolio(): Portfolio {
    return {
      cashCad: 5000,
      startingBalanceCad: 5000,
      holdings: [],
      transactions: [],
      snapshots: [],
      realizedGainLossCad: 0,
    };
  }

  it('sets firstPurchaseDate on a newly created holding', () => {
    const portfolio = emptyPortfolio();
    const preview = buildBuyPreview({
      order: { symbol: 'TD.TO', quantity: 1, purchaseDate: '2020-01-02' },
      quote: cadQuote({ priceNative: 100 }),
      historicalQuote: {
        symbol: 'TD.TO',
        date: '2020-01-02',
        actualDate: '2020-01-02',
        closeNative: 50,
        openNative: 50,
        highNative: 51,
        lowNative: 49,
        currency: 'CAD',
      },
      fxRate: 1,
      currentCashCad: portfolio.cashCad,
    });
    const next = applyBuy(portfolio, preview).portfolio;
    expect(next.holdings[0].firstPurchaseDate).toBe('2020-01-02');
  });

  it('keeps the earlier firstPurchaseDate when a later back-dated buy lands', () => {
    let portfolio = emptyPortfolio();
    portfolio = applyBuy(
      portfolio,
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: 1, purchaseDate: '2018-06-01' },
        quote: cadQuote({ priceNative: 100 }),
        historicalQuote: {
          symbol: 'TD.TO',
          date: '2018-06-01',
          actualDate: '2018-06-01',
          closeNative: 50,
          openNative: 50,
          highNative: 51,
          lowNative: 49,
          currency: 'CAD',
        },
        fxRate: 1,
        currentCashCad: portfolio.cashCad,
      }),
    ).portfolio;
    portfolio = applyBuy(
      portfolio,
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: 1, purchaseDate: '2020-01-02' },
        quote: cadQuote({ priceNative: 100 }),
        historicalQuote: {
          symbol: 'TD.TO',
          date: '2020-01-02',
          actualDate: '2020-01-02',
          closeNative: 60,
          openNative: 60,
          highNative: 61,
          lowNative: 59,
          currency: 'CAD',
        },
        fxRate: 1,
        currentCashCad: portfolio.cashCad,
      }),
    ).portfolio;
    expect(portfolio.holdings[0].firstPurchaseDate).toBe('2018-06-01');
  });

  it('moves firstPurchaseDate earlier when the new buy is older than the recorded first', () => {
    let portfolio = emptyPortfolio();
    portfolio = applyBuy(
      portfolio,
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: 1, purchaseDate: '2020-01-02' },
        quote: cadQuote({ priceNative: 100 }),
        historicalQuote: {
          symbol: 'TD.TO',
          date: '2020-01-02',
          actualDate: '2020-01-02',
          closeNative: 60,
          openNative: 60,
          highNative: 61,
          lowNative: 59,
          currency: 'CAD',
        },
        fxRate: 1,
        currentCashCad: portfolio.cashCad,
      }),
    ).portfolio;
    portfolio = applyBuy(
      portfolio,
      buildBuyPreview({
        order: { symbol: 'TD.TO', quantity: 1, purchaseDate: '2016-01-04' },
        quote: cadQuote({ priceNative: 100 }),
        historicalQuote: {
          symbol: 'TD.TO',
          date: '2016-01-04',
          actualDate: '2016-01-04',
          closeNative: 40,
          openNative: 40,
          highNative: 41,
          lowNative: 39,
          currency: 'CAD',
        },
        fxRate: 1,
        currentCashCad: portfolio.cashCad,
      }),
    ).portfolio;
    expect(portfolio.holdings[0].firstPurchaseDate).toBe('2016-01-04');
  });

  it('threads purchaseDate + isTimeTraveled through to the transaction', () => {
    const portfolio = emptyPortfolio();
    const preview = buildBuyPreview({
      order: { symbol: 'TD.TO', quantity: 1, purchaseDate: '2020-01-02' },
      quote: cadQuote({ priceNative: 100 }),
      historicalQuote: {
        symbol: 'TD.TO',
        date: '2020-01-02',
        actualDate: '2020-01-02',
        closeNative: 50,
        openNative: 50,
        highNative: 51,
        lowNative: 49,
        currency: 'CAD',
      },
      fxRate: 1,
      currentCashCad: portfolio.cashCad,
    });
    const result = applyBuy(portfolio, preview);
    expect(result.transaction.purchaseDate).toBe('2020-01-02');
    expect(result.transaction.isTimeTraveled).toBe(true);
  });
});
