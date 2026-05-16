// Realized gain/loss math per PRD §24.5.
//
// Realized G/L is locked in on a sell. It does not change after the trade
// (unlike unrealized G/L, which fluctuates with current market price).
//
//   Realized G/L CAD = quantitySold × (sellPriceCad − averageCostCad)

export function realizedGainLossOnSell(
  quantitySold: number,
  sellPriceCad: number,
  averageCostCad: number,
): number {
  if (quantitySold <= 0) {
    throw new Error(
      `realizedGainLossOnSell: quantitySold must be > 0 (got ${quantitySold})`,
    );
  }
  return quantitySold * (sellPriceCad - averageCostCad);
}
