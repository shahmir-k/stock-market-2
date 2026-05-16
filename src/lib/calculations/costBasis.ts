// Cost basis + average cost math per PRD §10.3 + §24.5.
//
// Holdings auto-close when remaining quantity falls at or below
// HOLDING_CLOSE_EPSILON. The threshold matches PRD §24.5 exactly so floating
// point noise from chained sells (e.g., sell 0.999999 of 1.0) doesn't leave
// behind a stranded dust position.

import type { Holding } from '@/types/portfolio';

// PRD §24.5 — "If remaining quantity <= 0.000001, close/remove holding".
export const HOLDING_CLOSE_EPSILON = 1e-6;

// PRD §10.3 — average cost on additional buy:
//   New Average Cost = (Old Cost Basis + New Purchase Cost) / New Quantity
//
// `addPrice` is the new purchase's per-share price already converted to CAD
// (FX is applied by the trade module before we get here).
export function recalcAverageCost(
  oldQuantity: number,
  oldAverageCostCad: number,
  addQuantity: number,
  addPriceCad: number,
): number {
  if (addQuantity <= 0) {
    throw new Error(
      `recalcAverageCost: addQuantity must be > 0 (got ${addQuantity})`,
    );
  }
  const newQuantity = oldQuantity + addQuantity;
  if (newQuantity <= 0) {
    throw new Error(
      `recalcAverageCost: newQuantity must be > 0 (got ${newQuantity})`,
    );
  }
  const oldCostBasis = oldQuantity * oldAverageCostCad;
  const addCostBasis = addQuantity * addPriceCad;
  return (oldCostBasis + addCostBasis) / newQuantity;
}

// PRD §11.2 — Holding Cost Basis = Quantity × Average Cost (in CAD).
export function costBasis(quantity: number, averageCostCad: number): number {
  return quantity * averageCostCad;
}

export function holdingCostBasis(holding: Holding): number {
  return costBasis(holding.quantity, holding.averageCostCad);
}

// PRD §24.5 — partial sell does not change averageCostCad. The remaining
// quantity is computed by the caller; this helper only decides whether what
// remains should be treated as zero so the holding can be removed.
export function isHoldingClosed(remainingQuantity: number): boolean {
  return remainingQuantity <= HOLDING_CLOSE_EPSILON;
}
