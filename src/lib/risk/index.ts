// Risk warning detection per PRD §12.3 + §24.10.
//
// Two evaluation passes:
//   - evaluatePreTradeWarnings(): used in TradePreview. Looks at the trade
//     about to happen and flags issues (e.g., this buy would put 72% in one
//     stock).
//   - evaluatePostTradeWarnings(): used in the store after a trade is
//     applied. Persists into the warnings array.
//
// Warnings educate, never block (PRD §12.3).

import { v4 as uuidv4 } from 'uuid';

import {
  holdingMarketValue,
  portfolioValueCad,
  sectorBreakdownCad,
} from '@/lib/calculations/portfolio';
import { LEARN } from '@/lib/learning';
import type { Portfolio, RiskWarning } from '@/types/portfolio';
import type { TradePreview } from '@/types/trading';

const PANIC_DROP_PCT = 5; // sell when current price ≥5% below avg cost
const CHASE_RISE_PCT = 5; // buy when daily change ≥5%
const OVERTRADE_LIMIT = 5; // >5 trades in one day

function makeWarning(
  type: RiskWarning['type'],
  severity: RiskWarning['severity'],
  title: string,
  message: string,
  opts: { relatedSymbol?: string; relatedLearningSlugs?: string[] } = {},
): RiskWarning {
  return {
    id: uuidv4(),
    type,
    severity,
    title,
    message,
    relatedSymbol: opts.relatedSymbol,
    relatedLearningSlugs: opts.relatedLearningSlugs,
    createdAt: new Date().toISOString(),
    acknowledged: false,
  };
}

// ---------------------------------------------------------------------------
// Pre-trade — look at the trade preview + current portfolio to flag risk.
// ---------------------------------------------------------------------------

export function evaluatePreTradeWarnings(
  portfolio: Portfolio,
  preview: TradePreview,
): RiskWarning[] {
  const warnings: RiskWarning[] = [];
  const holdings = portfolio.holdings;
  const total = portfolioValueCad(portfolio.cashCad, holdings);

  if (preview.type === 'BUY') {
    // Project post-buy state for this symbol.
    const existing = holdings.find((h) => h.symbol === preview.symbol);
    const newHoldingValue =
      (existing ? holdingMarketValue(existing) : 0) + preview.totalCad;
    const projectedTotal =
      total + 0; // buy: cash decreases by totalCad, holdings increase by totalCad → net 0 change
    const newPctOfPortfolio =
      projectedTotal > 0 ? (newHoldingValue / projectedTotal) * 100 : 0;
    if (newPctOfPortfolio > 50) {
      warnings.push(
        makeWarning(
          'CONCENTRATION_SINGLE_STOCK',
          'HIGH',
          'Single-stock concentration',
          `This trade would put ${newPctOfPortfolio.toFixed(0)}% of your portfolio into ${preview.symbol}. That creates concentration risk because one bad event could affect most of your portfolio.`,
          {
            relatedSymbol: preview.symbol,
            relatedLearningSlugs: [
              LEARN.CONCENTRATION_RISK,
              LEARN.DIVERSIFICATION,
            ],
          },
        ),
      );
    }

    // Cash after trade
    const cashAfterPct =
      projectedTotal > 0
        ? (preview.estimatedCashAfterCad / projectedTotal) * 100
        : 0;
    if (cashAfterPct < 1) {
      warnings.push(
        makeWarning(
          'NO_CASH_RESERVE',
          'MEDIUM',
          'No cash reserve',
          'This trade would leave almost no cash. You will not be able to make additional trades until you sell something.',
          { relatedLearningSlugs: [LEARN.GOING_ALL_IN, LEARN.CASH_BALANCE] },
        ),
      );
    }

    // Performance chasing — buy after sharp rise (≥5% today).
    // Currently the preview doesn't carry intraday change; we approximate by
    // checking if the price > previousClose by ≥5% IF that data is in scope
    // (it's on the QuoteResponseData but not in TradePreview). For MVP we
    // skip this check at preview-time and let post-trade fire if needed.
  } else if (preview.type === 'SELL') {
    // Panic selling — sell when current price is meaningfully below avg cost.
    const existing = holdings.find((h) => h.symbol === preview.symbol);
    if (existing && existing.averageCostCad > 0) {
      const dropPct =
        ((existing.averageCostCad - preview.priceCad) / existing.averageCostCad) *
        100;
      if (dropPct >= PANIC_DROP_PCT) {
        warnings.push(
          makeWarning(
            'PANIC_SELLING',
            'MEDIUM',
            'Panic selling risk',
            `${preview.symbol} is currently ${dropPct.toFixed(1)}% below your average cost. Selling now locks in the loss. Consider whether your investing thesis has actually changed.`,
            {
              relatedSymbol: preview.symbol,
              relatedLearningSlugs: [
                LEARN.REALIZED_GAIN_LOSS,
                LEARN.RISK_VS_REWARD,
              ],
            },
          ),
        );
      }
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Post-trade — re-evaluate the now-current portfolio state.
// ---------------------------------------------------------------------------

export function evaluatePostTradeWarnings(
  portfolio: Portfolio,
): RiskWarning[] {
  const warnings: RiskWarning[] = [];
  const holdings = portfolio.holdings;
  const total = portfolioValueCad(portfolio.cashCad, holdings);

  if (holdings.length === 0) return warnings;

  // Single-stock concentration ≥50%
  for (const h of holdings) {
    const pct = total > 0 ? (holdingMarketValue(h) / total) * 100 : 0;
    if (pct > 50) {
      warnings.push(
        makeWarning(
          'CONCENTRATION_SINGLE_STOCK',
          'HIGH',
          'Single-stock concentration',
          `${h.symbol} now makes up ${pct.toFixed(0)}% of your portfolio.`,
          {
            relatedSymbol: h.symbol,
            relatedLearningSlugs: [LEARN.CONCENTRATION_RISK, LEARN.DIVERSIFICATION],
          },
        ),
      );
    }
  }

  // Sector concentration > 70%
  const sectors = sectorBreakdownCad(holdings);
  for (const [sector, value] of Object.entries(sectors)) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    if (pct > 70) {
      warnings.push(
        makeWarning(
          'CONCENTRATION_SECTOR',
          'MEDIUM',
          'Sector concentration',
          `${pct.toFixed(0)}% of your portfolio is in ${sector}.`,
          { relatedLearningSlugs: [LEARN.SECTOR_RISK, LEARN.DIVERSIFICATION] },
        ),
      );
    }
  }

  // Lack of diversification — only one holding
  if (holdings.length === 1) {
    warnings.push(
      makeWarning(
        'LACK_OF_DIVERSIFICATION',
        'LOW',
        'Lack of diversification',
        'Your portfolio currently holds a single asset. Diversification can reduce risk.',
        { relatedLearningSlugs: [LEARN.DIVERSIFICATION] },
      ),
    );
  }

  // Overtrading — >5 trades today
  const todayKey = new Date().toISOString().slice(0, 10);
  const tradesToday = portfolio.transactions.filter((t) =>
    t.timestamp.startsWith(todayKey),
  ).length;
  if (tradesToday > OVERTRADE_LIMIT) {
    warnings.push(
      makeWarning(
        'OVERTRADING',
        'INFO',
        'Overtrading',
        `You have made ${tradesToday} trades today. Frequent trading can hurt long-term returns.`,
        { relatedLearningSlugs: [LEARN.RISK_VS_REWARD] },
      ),
    );
  }

  // Performance chasing — buy when previous close → current price ≥ +5%
  const last = portfolio.transactions[portfolio.transactions.length - 1];
  if (last && last.type === 'BUY') {
    const h = holdings.find((x) => x.symbol === last.symbol);
    if (h) {
      // No intraday change stored on holding; we use last execution price vs
      // the (very recent) avg cost as a rough proxy. Could be improved when
      // quote is enriched with previousClose at trade time.
      const movePct =
        ((last.priceCad - h.averageCostCad) / Math.max(h.averageCostCad, 0.01)) *
        100;
      if (movePct >= CHASE_RISE_PCT) {
        warnings.push(
          makeWarning(
            'PERFORMANCE_CHASING',
            'INFO',
            'Chasing performance',
            `${last.symbol} has risen recently. Buying after a sharp rise can mean paying near the top.`,
            { relatedLearningSlugs: [LEARN.RISK_VS_REWARD, LEARN.VOLATILITY] },
          ),
        );
      }
    }
  }

  return warnings;
}

// Compute fresh warnings that aren't already active (PRD §24.10).
// Exported so callers can persist *only* novel warnings rather than
// the whole `fresh` set (otherwise Supabase fills up with duplicates).
export function novelWarnings(
  existing: RiskWarning[],
  fresh: RiskWarning[],
): RiskWarning[] {
  const activeKeys = new Set(
    existing
      .filter((w) => !w.acknowledged)
      .map((w) => `${w.type}:${w.relatedSymbol ?? ''}`),
  );
  return fresh.filter(
    (w) => !activeKeys.has(`${w.type}:${w.relatedSymbol ?? ''}`),
  );
}

// Dedupe active warnings by `type + relatedSymbol` (PRD §24.10).
export function dedupeWarnings(
  existing: RiskWarning[],
  fresh: RiskWarning[],
): RiskWarning[] {
  return [...existing, ...novelWarnings(existing, fresh)];
}
