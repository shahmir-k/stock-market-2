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
