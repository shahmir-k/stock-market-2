// Portfolio analytics per PRD §11.
//
// All values are CAD-denominated. Functions are pure and do not round —
// the display layer rounds to 2 decimals (currency) or 2 decimals (percent)
// per PRD §18.8. Rounding inside these functions would compound across sums
// and cause the holdings allocation totals to drift away from 100%.

import type { Holding } from '@/types/portfolio';
import { holdingCostBasis } from './costBasis';

// ---------------------------------------------------------------------------
// Per-holding metrics
// ---------------------------------------------------------------------------

// PRD §11.2 — Holding Market Value = Quantity × Current Price in CAD.
export function holdingMarketValue(holding: Holding): number {
  return holding.quantity * holding.currentPriceCad;
}

// PRD §11.2 — Unrealized Gain/Loss = Market Value − Cost Basis.
export function holdingUnrealizedGainLoss(holding: Holding): number {
  return holdingMarketValue(holding) - holdingCostBasis(holding);
}

// Unrealized G/L as a percent of cost basis. Returns 0 when cost basis is 0
// to avoid divide-by-zero on freshly created dust positions.
export function holdingUnrealizedGainLossPercent(holding: Holding): number {
  const cost = holdingCostBasis(holding);
  if (cost === 0) return 0;
  return (holdingUnrealizedGainLoss(holding) / cost) * 100;
}

// ---------------------------------------------------------------------------
// Portfolio-level aggregates
// ---------------------------------------------------------------------------

// PRD §11.2 — Total Portfolio Value = Cash + Sum of Holding Market Values.
// `investedValue` is the holdings portion only.
export function investedValueCad(holdings: Holding[]): number {
  return holdings.reduce((sum, h) => sum + holdingMarketValue(h), 0);
}

export function portfolioValueCad(
  cashCad: number,
  holdings: Holding[],
): number {
  return cashCad + investedValueCad(holdings);
}

// PRD §11.2 — Total Return CAD = Portfolio Value − Starting Balance.
export function totalReturnCad(
  portfolioValueCad: number,
  startingBalanceCad: number,
): number {
  return portfolioValueCad - startingBalanceCad;
}

// PRD §11.2 — Total Return % = Total Return CAD / Starting Balance × 100.
export function totalReturnPercent(
  portfolioValueCad: number,
  startingBalanceCad: number,
): number {
  if (startingBalanceCad === 0) return 0;
  return (
    (totalReturnCad(portfolioValueCad, startingBalanceCad) /
      startingBalanceCad) *
    100
  );
}

// Sum of unrealized G/L across all open holdings (for portfolio summary).
export function unrealizedGainLossTotalCad(holdings: Holding[]): number {
  return holdings.reduce((sum, h) => sum + holdingUnrealizedGainLoss(h), 0);
}

// ---------------------------------------------------------------------------
// Allocation breakdown — used by sector chart, holdings table %, dashboard.
// ---------------------------------------------------------------------------

// Per-holding allocation as % of total portfolio value (cash included).
export function holdingAllocationPercent(
  holding: Holding,
  totalPortfolioValueCad: number,
): number {
  if (totalPortfolioValueCad === 0) return 0;
  return (holdingMarketValue(holding) / totalPortfolioValueCad) * 100;
}

// Cash slice as % of total portfolio value — rendered as its own pie slice
// in the sector chart per PRD §16.
export function cashAllocationPercent(
  cashCad: number,
  totalPortfolioValueCad: number,
): number {
  if (totalPortfolioValueCad === 0) return 0;
  return (cashCad / totalPortfolioValueCad) * 100;
}

// Sector → CAD value aggregate. Missing sectors are bucketed as 'Unknown'
// per PRD §16 sector chart rules.
export function sectorBreakdownCad(
  holdings: Holding[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const h of holdings) {
    const sector = h.sector && h.sector.trim().length > 0 ? h.sector : 'Unknown';
    out[sector] = (out[sector] ?? 0) + holdingMarketValue(h);
  }
  return out;
}
