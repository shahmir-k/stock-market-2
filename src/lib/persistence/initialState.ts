// Default state factories. Used by the store on first load and on reset.

import type {
  Portfolio,
  PortfolioSnapshot,
  SimulationConfig,
} from '@/types/portfolio';

export const STARTING_BALANCE_CAD = 5000;

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  startingBalanceCad: STARTING_BALANCE_CAD,
  baseCurrency: 'CAD',
  allowFractionalShares: true,
  allowCrypto: false,
  allowOptions: false,
  allowShortSelling: false,
  allowMargin: false,
  feesEnabled: false,
};

export function makeInitialPortfolio(
  startingBalanceCad: number = STARTING_BALANCE_CAD,
  now: string = new Date().toISOString(),
): Portfolio {
  const initialSnapshot: PortfolioSnapshot = {
    timestamp: now,
    totalValueCad: startingBalanceCad,
    cashCad: startingBalanceCad,
    investedValueCad: 0,
    totalReturnCad: 0,
    totalReturnPercent: 0,
  };
  return {
    cashCad: startingBalanceCad,
    startingBalanceCad,
    holdings: [],
    transactions: [],
    snapshots: [initialSnapshot],
    realizedGainLossCad: 0,
  };
}
