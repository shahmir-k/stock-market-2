// Sell-side preview construction per PRD §10.2 + §27.4.

import { v4 as uuidv4 } from 'uuid';

import { isHoldingClosed } from '@/lib/calculations/costBasis';
import { realizedGainLossOnSell } from '@/lib/calculations/realizedGainLoss';
import { assertFxAvailable, FxUnavailableError, toCad, type FxRate } from '@/lib/currency';
import type { HistoricalQuoteResponseData, QuoteResponseData } from '@/types/market';
import type { Holding, RiskWarning } from '@/types/portfolio';
import type { SellOrderInput, TradePreview } from '@/types/trading';

import { TradeValidationError } from './errors';

export type BuildSellPreviewInput = {
  order: SellOrderInput;
  quote: QuoteResponseData;
  // Time-travel: when present, drives `priceNative` instead of the live quote.
  historicalQuote?: HistoricalQuoteResponseData;
  fxRate: FxRate;
  holding: Holding | null;
  currentCashCad: number;
  warnings?: RiskWarning[];
};

export function buildSellPreview(input: BuildSellPreviewInput): TradePreview {
  const {
    order,
    quote,
    historicalQuote,
    fxRate,
    holding,
    currentCashCad,
    warnings = [],
  } = input;

  // Ownership validation (PRD §10.2).
  if (!holding) {
    throw new TradeValidationError(
      'NOT_OWNED',
      'You do not own this asset.',
    );
  }

  // Time-travel: gate sell on first-purchase date (PRD §10.2 + §13).
  if (
    order.purchaseDate &&
    holding.firstPurchaseDate &&
    order.purchaseDate < holding.firstPurchaseDate
  ) {
    throw new TradeValidationError(
      'BEFORE_FIRST_PURCHASE',
      `You didn't own ${holding.symbol} before ${holding.firstPurchaseDate}.`,
    );
  }

  if (!Number.isFinite(order.quantity) || order.quantity <= 0) {
    throw new TradeValidationError(
      'INVALID_QUANTITY',
      'Enter a quantity greater than 0.',
    );
  }
  if (order.quantity > holding.quantity) {
    throw new TradeValidationError(
      'EXCEEDS_OWNED',
      'You cannot sell more shares than you own.',
    );
  }

  const priceNative = historicalQuote?.closeNative ?? quote.priceNative;
  if (!Number.isFinite(priceNative) || priceNative <= 0) {
    throw new TradeValidationError(
      'NO_QUOTE',
      'Quote unavailable for this asset.',
    );
  }

  try {
    assertFxAvailable(quote.currency, fxRate);
  } catch (err) {
    if (err instanceof FxUnavailableError) {
      throw new TradeValidationError(
        'UNSUPPORTED_CURRENCY',
        'Currency conversion is unavailable, so this trade cannot be completed.',
      );
    }
    throw err;
  }

  const effectiveFxRate = quote.currency === 'CAD' ? 1 : (fxRate as number);
  const priceCad = toCad(priceNative, quote.currency, fxRate);
  const totalCad = order.quantity * priceCad;

  // Realized G/L estimate (PRD §24.5). averageCostCad is unchanged on sells.
  const realized = realizedGainLossOnSell(
    order.quantity,
    priceCad,
    holding.averageCostCad,
  );

  const remaining = holding.quantity - order.quantity;
  // Note: closing logic also lives in apply.ts; this is just the preview.
  void isHoldingClosed(remaining);

  const today = new Date().toISOString().slice(0, 10);
  const purchaseDate =
    historicalQuote?.date ?? order.purchaseDate ?? today;
  const isTimeTraveled = Boolean(historicalQuote) || purchaseDate !== today;
  const quoteTimestamp = historicalQuote
    ? new Date(`${historicalQuote.actualDate}T00:00:00Z`).toISOString()
    : quote.quoteTimestamp;

  return {
    id: uuidv4(),
    type: 'SELL',
    symbol: holding.symbol,
    assetName: holding.assetName,
    assetType: holding.assetType,
    quantity: order.quantity,
    priceNative,
    nativeCurrency: quote.currency,
    fxRateToCad: effectiveFxRate,
    priceCad,
    totalCad,
    estimatedCashAfterCad: currentCashCad + totalCad,
    estimatedRealizedGainLossCad: realized,
    quoteTimestamp,
    warnings,
    purchaseDate,
    isTimeTraveled,
    ...(isTimeTraveled ? { fxRateDate: purchaseDate } : {}),
    ...(historicalQuote ? { actualPriceDate: historicalQuote.actualDate } : {}),
  };
}
