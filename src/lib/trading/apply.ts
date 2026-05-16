// Pure reducer that applies a confirmed TradePreview to the portfolio.
// Returns the new portfolio + the transaction + the post-trade snapshot.
//
// Caller (the store) is responsible for: persisting to localStorage/Supabase,
// emitting risk warnings, refreshing UI. This module does math + state shape.

import { v4 as uuidv4 } from 'uuid';

import { isHoldingClosed, recalcAverageCost } from '@/lib/calculations/costBasis';
import {
  investedValueCad,
  portfolioValueCad,
  totalReturnCad,
  totalReturnPercent,
} from '@/lib/calculations/portfolio';
import type {
  Holding,
  Portfolio,
  PortfolioSnapshot,
  Transaction,
} from '@/types/portfolio';
import type { TradePreview } from '@/types/trading';

export type ApplyTradeResult = {
  portfolio: Portfolio;
  transaction: Transaction;
  snapshot: PortfolioSnapshot;
};

function makeTransaction(
  portfolioBefore: Portfolio,
  preview: TradePreview,
  realizedGainLossCad: number | undefined,
  now: string,
): Transaction {
  // Use the underscore-prefixed param name to keep TS happy if portfolio is
  // unused; we keep the signature symmetric for future fields like portfolioId.
  void portfolioBefore;
  return {
    id: uuidv4(),
    type: preview.type,
    symbol: preview.symbol,
    assetName: preview.assetName,
    assetType: preview.assetType,
    quantity: preview.quantity,
    priceNative: preview.priceNative,
    nativeCurrency: preview.nativeCurrency,
    fxRateToCad: preview.fxRateToCad,
    priceCad: preview.priceCad,
    totalCad: preview.totalCad,
    realizedGainLossCad,
    timestamp: now,
    quoteTimestamp: preview.quoteTimestamp,
  };
}

function makeSnapshot(portfolio: Portfolio, now: string): PortfolioSnapshot {
  const invested = investedValueCad(portfolio.holdings);
  const totalValue = portfolioValueCad(portfolio.cashCad, portfolio.holdings);
  return {
    timestamp: now,
    totalValueCad: totalValue,
    cashCad: portfolio.cashCad,
    investedValueCad: invested,
    totalReturnCad: totalReturnCad(totalValue, portfolio.startingBalanceCad),
    totalReturnPercent: totalReturnPercent(
      totalValue,
      portfolio.startingBalanceCad,
    ),
  };
}

// ---------------------------------------------------------------------------
// applyBuy
// ---------------------------------------------------------------------------

export function applyBuy(
  portfolio: Portfolio,
  preview: TradePreview,
  now: string = new Date().toISOString(),
): ApplyTradeResult {
  if (preview.type !== 'BUY') {
    throw new Error(`applyBuy received non-BUY preview (${preview.type})`);
  }

  // Upsert holding.
  const existing = portfolio.holdings.find(
    (h) => h.symbol === preview.symbol,
  );
  let nextHoldings: Holding[];
  if (existing) {
    const newQty = existing.quantity + preview.quantity;
    const newAvg = recalcAverageCost(
      existing.quantity,
      existing.averageCostCad,
      preview.quantity,
      preview.priceCad,
    );
    nextHoldings = portfolio.holdings.map((h) =>
      h.symbol === preview.symbol
        ? {
            ...h,
            quantity: newQty,
            averageCostCad: newAvg,
            currentPriceNative: preview.priceNative,
            currentPriceCad: preview.priceCad,
            nativeCurrency: preview.nativeCurrency,
            fxRateToCad: preview.fxRateToCad,
            lastQuoteAt: preview.quoteTimestamp,
          }
        : h,
    );
  } else {
    const fresh: Holding = {
      symbol: preview.symbol,
      assetName: preview.assetName,
      assetType: preview.assetType,
      quantity: preview.quantity,
      averageCostCad: preview.priceCad,
      currentPriceNative: preview.priceNative,
      currentPriceCad: preview.priceCad,
      nativeCurrency: preview.nativeCurrency,
      fxRateToCad: preview.fxRateToCad,
      lastQuoteAt: preview.quoteTimestamp,
    };
    nextHoldings = [...portfolio.holdings, fresh];
  }

  const transaction = makeTransaction(portfolio, preview, undefined, now);

  // Build interim portfolio (without snapshot yet) so snapshot reflects trade.
  const interim: Portfolio = {
    ...portfolio,
    cashCad: portfolio.cashCad - preview.totalCad,
    holdings: nextHoldings,
    transactions: [...portfolio.transactions, transaction],
  };

  const snapshot = makeSnapshot(interim, now);

  const next: Portfolio = {
    ...interim,
    snapshots: [...interim.snapshots, snapshot],
  };

  return { portfolio: next, transaction, snapshot };
}

// ---------------------------------------------------------------------------
// applySell
// ---------------------------------------------------------------------------

export function applySell(
  portfolio: Portfolio,
  preview: TradePreview,
  now: string = new Date().toISOString(),
): ApplyTradeResult {
  if (preview.type !== 'SELL') {
    throw new Error(`applySell received non-SELL preview (${preview.type})`);
  }

  const existing = portfolio.holdings.find(
    (h) => h.symbol === preview.symbol,
  );
  if (!existing) {
    throw new Error(
      `applySell: holding ${preview.symbol} not found in portfolio`,
    );
  }

  const remaining = existing.quantity - preview.quantity;

  let nextHoldings: Holding[];
  if (isHoldingClosed(remaining)) {
    nextHoldings = portfolio.holdings.filter(
      (h) => h.symbol !== preview.symbol,
    );
  } else {
    // Partial sell: averageCostCad is unchanged (PRD §24.5).
    nextHoldings = portfolio.holdings.map((h) =>
      h.symbol === preview.symbol
        ? {
            ...h,
            quantity: remaining,
            currentPriceNative: preview.priceNative,
            currentPriceCad: preview.priceCad,
            nativeCurrency: preview.nativeCurrency,
            fxRateToCad: preview.fxRateToCad,
            lastQuoteAt: preview.quoteTimestamp,
          }
        : h,
    );
  }

  const realized = preview.estimatedRealizedGainLossCad ?? 0;
  const transaction = makeTransaction(portfolio, preview, realized, now);

  const interim: Portfolio = {
    ...portfolio,
    cashCad: portfolio.cashCad + preview.totalCad,
    realizedGainLossCad: portfolio.realizedGainLossCad + realized,
    holdings: nextHoldings,
    transactions: [...portfolio.transactions, transaction],
  };

  const snapshot = makeSnapshot(interim, now);

  const next: Portfolio = {
    ...interim,
    snapshots: [...interim.snapshots, snapshot],
  };

  return { portfolio: next, transaction, snapshot };
}
