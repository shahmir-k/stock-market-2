// Buy-side preview construction per PRD §10.1 + §27.4.
//
// Pure function: caller is responsible for fetching the quote and FX rate.
// This keeps the trade module testable without network mocks.

import { v4 as uuidv4 } from 'uuid';

import { assertFxAvailable, FxUnavailableError, toCad, type FxRate } from '@/lib/currency';
import type { HistoricalQuoteResponseData, QuoteResponseData } from '@/types/market';
import type { BuyOrderInput, TradePreview } from '@/types/trading';
import type { RiskWarning } from '@/types/portfolio';

import { TradeValidationError } from './errors';

export type BuildBuyPreviewInput = {
  order: BuyOrderInput;
  quote: QuoteResponseData;
  // Time-travel: when present, drives `priceNative` instead of the live quote.
  // `currency` on the historical record is sourced from the live quote.
  historicalQuote?: HistoricalQuoteResponseData;
  fxRate: FxRate;
  currentCashCad: number;
  warnings?: RiskWarning[];
};

export function buildBuyPreview(input: BuildBuyPreviewInput): TradePreview {
  const { order, quote, historicalQuote, fxRate, currentCashCad, warnings = [] } = input;

  // Quantity validation (PRD §10.1).
  if (!Number.isFinite(order.quantity) || order.quantity <= 0) {
    throw new TradeValidationError(
      'INVALID_QUANTITY',
      'Enter a quantity greater than 0.',
    );
  }

  const priceNative = historicalQuote?.closeNative ?? quote.priceNative;
  if (!Number.isFinite(priceNative) || priceNative <= 0) {
    throw new TradeValidationError(
      'NO_QUOTE',
      'Quote unavailable for this asset.',
    );
  }

  // Currency conversion (PRD §18.3 / §24.4).
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

  // Cash validation (PRD §10.1).
  if (totalCad > currentCashCad) {
    throw new TradeValidationError(
      'INSUFFICIENT_CASH',
      'You do not have enough cash for this trade.',
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const purchaseDate =
    historicalQuote?.date ?? order.purchaseDate ?? today;
  const isTimeTraveled = Boolean(historicalQuote) || purchaseDate !== today;
  // Use the historical bar's actual date as the quote timestamp when present
  // (PRD §10.3) — UI shows the wall-clock `timestamp` separately.
  const quoteTimestamp = historicalQuote
    ? new Date(`${historicalQuote.actualDate}T00:00:00Z`).toISOString()
    : quote.quoteTimestamp;

  return {
    id: uuidv4(),
    type: 'BUY',
    symbol: quote.symbol,
    assetName: quote.name,
    assetType: quote.assetType,
    quantity: order.quantity,
    priceNative,
    nativeCurrency: quote.currency,
    fxRateToCad: effectiveFxRate,
    priceCad,
    totalCad,
    estimatedCashAfterCad: currentCashCad - totalCad,
    quoteTimestamp,
    warnings,
    purchaseDate,
    isTimeTraveled,
    ...(isTimeTraveled ? { fxRateDate: purchaseDate } : {}),
    ...(historicalQuote ? { actualPriceDate: historicalQuote.actualDate } : {}),
  };
}
