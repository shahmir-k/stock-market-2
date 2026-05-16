// Portfolio data model per PRD §15.
// `Transaction` lives here (not in trading.ts) because Portfolio.transactions[]
// owns the array — keeps trading.ts free of circular imports.

import type { AssetType, Freshness } from './market';

// PRD §15.2
export type LocalUser = {
  id: string;
  displayName?: string;
};

// Auth session lifecycle, used by the store (PRD §27.1).
export type AuthSessionStatus = 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

// Sync lifecycle for Supabase writes (PRD §34.11).
export type SyncStatus = 'SYNCED' | 'SYNCING' | 'UNSYNCED' | 'ERROR';

// Mock vs live market data provider (PRD §24.8).
export type MarketDataMode = 'API' | 'MOCK';

// PRD §15.3 — locked simulator config.
export type SimulationConfig = {
  startingBalanceCad: number;
  baseCurrency: 'CAD';
  allowFractionalShares: true;
  allowCrypto: false;
  allowOptions: false;
  allowShortSelling: false;
  allowMargin: false;
  feesEnabled: false;
};

// PRD §15.5 — open holding.
// Field types follow PRD verbatim (e.g., exchange/nativeCurrency as string).
export type Holding = {
  symbol: string;
  assetName: string;
  assetType: AssetType;
  exchange?: string;
  sector?: string;
  quantity: number;
  averageCostCad: number;
  currentPriceNative: number;
  currentPriceCad: number;
  nativeCurrency: string;
  fxRateToCad: number;
  lastQuoteAt: string;
  // Not in PRD §15.5 but persisted in PRD §34.4 (`holdings.quote_freshness`).
  quoteFreshness?: Freshness;
};

// PRD §15.6 — immutable trade record. Lives in portfolio.ts because Portfolio owns
// `transactions[]`. Trading-flow types (TradePreview, TradeResult) reference this
// from trading.ts.
export type TransactionType = 'BUY' | 'SELL';

export type Transaction = {
  id: string;
  type: TransactionType;
  symbol: string;
  assetName: string;
  assetType: AssetType;
  quantity: number;
  priceNative: number;
  nativeCurrency: string;
  fxRateToCad: number;
  priceCad: number;
  totalCad: number;
  realizedGainLossCad?: number;
  timestamp: string;
  quoteTimestamp: string;
};

// PRD §15.7 — point on the portfolio value chart.
export type PortfolioSnapshot = {
  timestamp: string;
  totalValueCad: number;
  cashCad: number;
  investedValueCad: number;
  totalReturnCad: number;
  totalReturnPercent: number;
};

// PRD §15.8 — risk warning.
export type WarningSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';

// Trigger taxonomy from PRD §12.3.
export type RiskWarningType =
  | 'CONCENTRATION_SINGLE_STOCK'
  | 'CONCENTRATION_SECTOR'
  | 'LACK_OF_DIVERSIFICATION'
  | 'NO_CASH_RESERVE'
  | 'OVERTRADING'
  | 'PANIC_SELLING'
  | 'PERFORMANCE_CHASING';

export type RiskWarning = {
  id: string;
  type: RiskWarningType;
  severity: WarningSeverity;
  title: string;
  message: string;
  relatedSymbol?: string;
  relatedLearningSlugs?: string[];
  createdAt: string;
  acknowledged: boolean;
};

// PRD §15.4 — root portfolio object.
export type Portfolio = {
  cashCad: number;
  startingBalanceCad: number;
  holdings: Holding[];
  transactions: Transaction[];
  snapshots: PortfolioSnapshot[];
  realizedGainLossCad: number;
};
