// Diversification scoring + label per PRD §12.1 and §12.2.

import {
  cashAllocationPercent,
  holdingMarketValue,
  investedValueCad,
  portfolioValueCad,
  sectorBreakdownCad,
} from '@/lib/calculations/portfolio';
import type { Holding } from '@/types/portfolio';

export type DiversificationLabel =
  | 'Strong diversification'
  | 'Good diversification'
  | 'Moderate concentration'
  | 'High concentration risk'
  | 'Very high concentration risk';

export type DiversificationResult = {
  score: number;
  label: DiversificationLabel;
  sectorBreakdown: Record<string, number>;
  reasons: string[]; // human-readable explanation lines
};

export function diversificationLabel(score: number): DiversificationLabel {
  if (score >= 85) return 'Strong diversification';
  if (score >= 70) return 'Good diversification';
  if (score >= 50) return 'Moderate concentration';
  if (score >= 30) return 'High concentration risk';
  return 'Very high concentration risk';
}

export function calculateDiversification(
  cashCad: number,
  holdings: Holding[],
): DiversificationResult {
  const total = portfolioValueCad(cashCad, holdings);
  const invested = investedValueCad(holdings);
  const sectors = sectorBreakdownCad(holdings);
  const sectorCount = Object.keys(sectors).length;
  const reasons: string[] = [];

  let score = 100;

  if (invested > 0) {
    const maxHoldingPct = Math.max(
      ...holdings.map((h) => (holdingMarketValue(h) / invested) * 100),
      0,
    );
    if (maxHoldingPct > 60) {
      score -= 30;
      reasons.push('One holding makes up more than 60% of invested value.');
    }
    const maxSectorPct = Math.max(
      ...Object.values(sectors).map((v) => (v / invested) * 100),
      0,
    );
    if (maxSectorPct > 70) {
      score -= 20;
      reasons.push('One sector makes up more than 70% of invested value.');
    }
  }

  if (holdings.length < 3) {
    score -= 15;
    reasons.push('Fewer than 3 holdings.');
  }
  if (sectorCount < 2) {
    score -= 10;
    reasons.push('Fewer than 2 sectors represented.');
  }

  const cashPct = cashAllocationPercent(cashCad, total);
  if (cashPct < 1 && total > 0) {
    score -= 10;
    reasons.push('Cash is less than 1% of the portfolio.');
  }
  // 100% cash after trading (i.e., user has no holdings but had at one point)
  // is hard to detect from current state alone. We approximate by checking if
  // there are no holdings AND cash equals total (i.e., no investments yet).
  // This is informational only — won't fire on first launch since reasons are
  // additive and label still reads "Strong" with score 100.
  if (holdings.length === 0 && cashPct === 100 && total > 0) {
    score -= 10;
    reasons.push('Portfolio is 100% cash.');
  }

  if (holdings.length >= 5) {
    score += 5;
  }
  if (sectorCount >= 3) {
    score += 5;
  }
  // Broad-market ETF — proxy via sector "Diversified".
  const hasBroadEtf = holdings.some(
    (h) => h.assetType === 'ETF' && (h.sector ?? '').toLowerCase() === 'diversified',
  );
  if (hasBroadEtf) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: diversificationLabel(score),
    sectorBreakdown: sectors,
    reasons,
  };
}
