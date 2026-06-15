// Trade-flow input/preview/result types per PRD §27.4.
// Persisted records (Transaction) live in portfolio.ts.

import type { AssetType, Currency } from './market';
import type { RiskWarning, Transaction, TransactionType } from './portfolio';

// PRD §27.4 — caller-provided buy intent.
export type BuyOrderInput = {
  symbol: string;
  exchange?: string;
  quantity: number;
  // Time-travel: YYYY-MM-DD. Undefined = today.
  purchaseDate?: string;
};

// PRD §27.4 — caller-provided sell intent.
export type SellOrderInput = {
  symbol: string;
  quantity: number;
  // Time-travel: YYYY-MM-DD. Undefined = today.
  purchaseDate?: string;
};

// PRD §27.4 — preview returned to UI before user confirms.
// `warnings` is populated by the risk module pre-trade (PRD §24.10).
export type TradePreview = {
  id: string;
  type: TransactionType;
  symbol: string;
  assetName: string;
  assetType: AssetType;
  quantity: number;
  priceNative: number;
  nativeCurrency: Currency;
  fxRateToCad: number;
  priceCad: number;
  totalCad: number;
  estimatedCashAfterCad: number;
  estimatedRealizedGainLossCad?: number;
  quoteTimestamp: string;
  warnings: RiskWarning[];
  // Time-travel: always set. Equals today (ISO) when not time-traveled.
  purchaseDate: string;
  isTimeTraveled: boolean;
  // ISO date of the FX rate used. Equals `purchaseDate` when historical.
  fxRateDate?: string;
  // ISO date the price actually came from. May be < `purchaseDate` when the
  // chosen day was a weekend/holiday and we resolved to the prior bar.
  actualPriceDate?: string;
};

// PRD §27.4 — outcome of executeBuy/executeSell.
export type TradeResult = {
  success: boolean;
  transaction?: Transaction;
  errors?: string[];
};
