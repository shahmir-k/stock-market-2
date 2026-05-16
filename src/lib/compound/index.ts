// Compound growth math per PRD §13.2.
//
//   FV = P × (1 + r/12)^(12t) + C × [((1 + r/12)^(12t) − 1) / (r/12)]
//
// where:
//   P = starting amount
//   C = monthly contribution
//   r = annual return as decimal (0.07 for 7%)
//   t = years invested

export type CompoundInput = {
  startingAmount: number;
  monthlyContribution: number;
  annualReturnPercent: number; // e.g., 7 for 7%
  years: number;
};

export type CompoundYearPoint = {
  year: number;
  contributedCad: number;
  futureValueCad: number;
};

export type CompoundResult = {
  totalContributedCad: number;
  futureValueCad: number;
  growthCad: number;
  yearlyPoints: CompoundYearPoint[];
};

function fvAt(
  starting: number,
  monthly: number,
  rDecimal: number,
  years: number,
): number {
  const months = years * 12;
  if (rDecimal === 0) {
    return starting + monthly * months;
  }
  const monthlyRate = rDecimal / 12;
  const compound = Math.pow(1 + monthlyRate, months);
  const startingFv = starting * compound;
  const contribFv = monthly * ((compound - 1) / monthlyRate);
  return startingFv + contribFv;
}

export function calculateCompound(input: CompoundInput): CompoundResult {
  const r = input.annualReturnPercent / 100;
  const years = Math.max(0, Math.round(input.years));

  const yearlyPoints: CompoundYearPoint[] = [];
  for (let y = 0; y <= years; y += 1) {
    const contributed = input.startingAmount + input.monthlyContribution * 12 * y;
    const fv = fvAt(input.startingAmount, input.monthlyContribution, r, y);
    yearlyPoints.push({
      year: y,
      contributedCad: contributed,
      futureValueCad: fv,
    });
  }

  const totalContributed =
    input.startingAmount + input.monthlyContribution * 12 * years;
  const futureValue = fvAt(
    input.startingAmount,
    input.monthlyContribution,
    r,
    years,
  );

  return {
    totalContributedCad: totalContributed,
    futureValueCad: futureValue,
    growthCad: futureValue - totalContributed,
    yearlyPoints,
  };
}
