// Sell-side preview construction per PRD §10.2 + §27.4.

import { v4 as uuidv4 } from 'uuid';

import { isHoldingClosed } from '@/lib/calculations/costBasis';
import { realizedGainLossOnSell } from '@/lib/calculations/realizedGainLoss';
import { assertFxAvailable, FxUnavailableError, toCad, type FxRate } from '@/lib/currency';
import type { QuoteResponseData } from '@/types/market';
import type { Holding, RiskWarning } from '@/types/portfolio';
import type { SellOrderInput, TradePreview } from '@/types/trading';

import { TradeValidationError } from './errors';

export type BuildSellPreviewInput = {
  order: SellOrderInput;
  quote: QuoteResponseData;
  fxRate: FxRate;
  holding: Holding | null;
  currentCashCad: number;
  warnings?: RiskWarning[];
};

export function buildSellPreview(input: BuildSellPreviewInput): TradePreview {
  const { order, quote, fxRate, holding, currentCashCad, warnings = [] } = input;

  // Ownership validation (PRD §10.2).
  if (!holding) {
    throw new TradeValidationError(
      'NOT_OWNED',
      'You do not own this asset.',
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
  if (!Number.isFinite(quote.priceNative) || quote.priceNative <= 0) {
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
  const priceCad = toCad(quote.priceNative, quote.currency, fxRate);
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

  return {
    id: uuidv4(),
    type: 'SELL',
    symbol: holding.symbol,
    assetName: holding.assetName,
    assetType: holding.assetType,
    quantity: order.quantity,
    priceNative: quote.priceNative,
    nativeCurrency: quote.currency,
    fxRateToCad: effectiveFxRate,
    priceCad,
    totalCad,
    estimatedCashAfterCad: currentCashCad + totalCad,
    estimatedRealizedGainLossCad: realized,
    quoteTimestamp: quote.quoteTimestamp,
    warnings,
  };
}
