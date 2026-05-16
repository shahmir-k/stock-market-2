// Buy-side preview construction per PRD §10.1 + §27.4.
//
// Pure function: caller is responsible for fetching the quote and FX rate.
// This keeps the trade module testable without network mocks.

import { v4 as uuidv4 } from 'uuid';

import { assertFxAvailable, FxUnavailableError, toCad, type FxRate } from '@/lib/currency';
import type { QuoteResponseData } from '@/types/market';
import type { BuyOrderInput, TradePreview } from '@/types/trading';
import type { RiskWarning } from '@/types/portfolio';

import { TradeValidationError } from './errors';

export type BuildBuyPreviewInput = {
  order: BuyOrderInput;
  quote: QuoteResponseData;
  fxRate: FxRate;
  currentCashCad: number;
  warnings?: RiskWarning[];
};

export function buildBuyPreview(input: BuildBuyPreviewInput): TradePreview {
  const { order, quote, fxRate, currentCashCad, warnings = [] } = input;

  // Quantity validation (PRD §10.1).
  if (!Number.isFinite(order.quantity) || order.quantity <= 0) {
    throw new TradeValidationError(
      'INVALID_QUANTITY',
      'Enter a quantity greater than 0.',
    );
  }
  if (!Number.isFinite(quote.priceNative) || quote.priceNative <= 0) {
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
  const priceCad = toCad(quote.priceNative, quote.currency, fxRate);
  const totalCad = order.quantity * priceCad;

  // Cash validation (PRD §10.1).
  if (totalCad > currentCashCad) {
    throw new TradeValidationError(
      'INSUFFICIENT_CASH',
      'You do not have enough cash for this trade.',
    );
  }

  return {
    id: uuidv4(),
    type: 'BUY',
    symbol: quote.symbol,
    assetName: quote.name,
    assetType: quote.assetType,
    quantity: order.quantity,
    priceNative: quote.priceNative,
    nativeCurrency: quote.currency,
    fxRateToCad: effectiveFxRate,
    priceCad,
    totalCad,
    estimatedCashAfterCad: currentCashCad - totalCad,
    quoteTimestamp: quote.quoteTimestamp,
    warnings,
  };
}
