// Supabase ↔ Zustand store sync.
//
// Strategy:
//   - On login / app load: `loadFromSupabase` fetches profile + active
//     portfolio + dependent rows. If none exist, it creates them with the
//     PRD §7.3 defaults ($5,000 CAD cash, no holdings).
//   - On each trade: `persistAfterBuy` / `persistAfterSell` write a
//     transaction insert + a portfolio cash update + a holdings upsert/delete
//     + a snapshot insert. Returns the portfolio_id.
//   - On reset: `resetPortfolioInSupabase` deletes dependent rows and
//     resets cash + realized G/L on the portfolio row.

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/database.types';
import type {
  Holding,
  LocalUser,
  MarketDataMode,
  Portfolio,
  PortfolioSnapshot,
  RiskWarning,
  Transaction,
} from '@/types/portfolio';

import { STARTING_BALANCE_CAD, makeInitialPortfolio } from './initialState';

type DB = SupabaseClient<Database>;

export type LoadedState = {
  user: LocalUser;
  portfolioId: string;
  portfolio: Portfolio;
  warnings: RiskWarning[];
  marketDataMode: MarketDataMode;
};

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export async function loadFromSupabase(
  supabase: DB,
  authUserId: string,
  authEmail: string,
): Promise<LoadedState> {
  // Profile — upsert if missing.
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUserId)
    .maybeSingle();

  if (!profileRow) {
    // Upsert (not insert) so concurrent bootstraps from React StrictMode's
    // double-effect don't trip the primary-key conflict.
    await supabase
      .from('profiles')
      .upsert({ id: authUserId, display_name: null }, { onConflict: 'id', ignoreDuplicates: true });
  }

  // Active portfolio — create if missing.
  const { data: portfolioRow } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', authUserId)
    .eq('is_active', true)
    .maybeSingle();

  let portfolioId: string;
  let cashCad: number;
  let realizedGainLossCad: number;
  let startingBalanceCad: number;
  let marketDataMode: MarketDataMode;

  if (!portfolioRow) {
    const { data: created } = await supabase
      .from('portfolios')
      .insert({
        user_id: authUserId,
        cash_cad: STARTING_BALANCE_CAD,
        starting_balance_cad: STARTING_BALANCE_CAD,
      })
      .select('*')
      .single();
    if (!created) {
      throw new Error('Failed to create portfolio.');
    }
    portfolioId = created.id;
    cashCad = Number(created.cash_cad);
    realizedGainLossCad = Number(created.realized_gain_loss_cad);
    startingBalanceCad = Number(created.starting_balance_cad);
    marketDataMode = created.market_data_mode;

    // Seed an initial snapshot so the chart has at least one point.
    const initialPortfolio = makeInitialPortfolio(
      startingBalanceCad,
      created.created_at,
    );
    await supabase.from('portfolio_snapshots').insert(
      initialPortfolio.snapshots.map((s) => ({
        portfolio_id: portfolioId,
        user_id: authUserId,
        total_value_cad: s.totalValueCad,
        cash_cad: s.cashCad,
        invested_value_cad: s.investedValueCad,
        total_return_cad: s.totalReturnCad,
        total_return_percent: s.totalReturnPercent,
      })),
    );
  } else {
    portfolioId = portfolioRow.id;
    cashCad = Number(portfolioRow.cash_cad);
    realizedGainLossCad = Number(portfolioRow.realized_gain_loss_cad);
    startingBalanceCad = Number(portfolioRow.starting_balance_cad);
    marketDataMode = portfolioRow.market_data_mode;
  }

  // Dependent rows.
  const [holdingsRes, transactionsRes, snapshotsRes, warningsRes] =
    await Promise.all([
      supabase.from('holdings').select('*').eq('portfolio_id', portfolioId),
      supabase
        .from('transactions')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: true }),
      supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: true }),
      supabase.from('risk_warnings').select('*').eq('portfolio_id', portfolioId),
    ]);

  const holdings: Holding[] = (holdingsRes.data ?? []).map((h) => ({
    symbol: h.symbol,
    assetName: h.asset_name,
    assetType: h.asset_type as 'STOCK' | 'ETF',
    exchange: h.exchange ?? undefined,
    sector: h.sector ?? undefined,
    quantity: Number(h.quantity),
    averageCostCad: Number(h.average_cost_cad),
    currentPriceNative: Number(h.current_price_native ?? 0),
    currentPriceCad: Number(h.current_price_cad ?? 0),
    nativeCurrency: h.native_currency,
    fxRateToCad: Number(h.fx_rate_to_cad),
    lastQuoteAt: h.last_quote_at ?? '',
    quoteFreshness: (h.quote_freshness as Holding['quoteFreshness']) ?? undefined,
    firstPurchaseDate: h.first_purchase_date ?? undefined,
  }));

  const transactions: Transaction[] = (transactionsRes.data ?? []).map((t) => ({
    id: t.id,
    type: t.type as 'BUY' | 'SELL',
    symbol: t.symbol,
    assetName: t.asset_name,
    assetType: t.asset_type as 'STOCK' | 'ETF',
    quantity: Number(t.quantity),
    priceNative: Number(t.price_native),
    nativeCurrency: t.native_currency,
    fxRateToCad: Number(t.fx_rate_to_cad),
    priceCad: Number(t.price_cad),
    totalCad: Number(t.total_cad),
    realizedGainLossCad:
      t.realized_gain_loss_cad === null ? undefined : Number(t.realized_gain_loss_cad),
    timestamp: t.created_at,
    quoteTimestamp: t.quote_timestamp,
    purchaseDate: t.purchase_date,
    isTimeTraveled: t.is_time_traveled,
  }));

  const snapshots: PortfolioSnapshot[] = (snapshotsRes.data ?? []).map((s) => ({
    timestamp: s.created_at,
    totalValueCad: Number(s.total_value_cad),
    cashCad: Number(s.cash_cad),
    investedValueCad: Number(s.invested_value_cad),
    totalReturnCad: Number(s.total_return_cad),
    totalReturnPercent: Number(s.total_return_percent),
  }));

  const warnings: RiskWarning[] = (warningsRes.data ?? []).map((w) => ({
    id: w.id,
    type: w.type as RiskWarning['type'],
    severity: w.severity,
    title: w.title,
    message: w.message,
    relatedSymbol: w.related_symbol ?? undefined,
    relatedLearningSlugs: w.related_learning_slugs,
    createdAt: w.created_at,
    acknowledged: w.acknowledged,
  }));

  return {
    user: {
      id: authUserId,
      displayName: profileRow?.display_name ?? authEmail.split('@')[0],
    },
    portfolioId,
    portfolio: {
      cashCad,
      startingBalanceCad,
      realizedGainLossCad,
      holdings,
      transactions,
      snapshots,
    },
    warnings,
    marketDataMode,
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function persistAfterTrade(
  supabase: DB,
  args: {
    userId: string;
    portfolioId: string;
    portfolio: Portfolio;
    transaction: Transaction;
    snapshot: PortfolioSnapshot;
  },
): Promise<void> {
  const { userId, portfolioId, portfolio, transaction, snapshot } = args;

  // 1. Insert transaction.
  await supabase.from('transactions').insert({
    id: transaction.id,
    portfolio_id: portfolioId,
    user_id: userId,
    type: transaction.type,
    symbol: transaction.symbol,
    asset_name: transaction.assetName,
    asset_type: transaction.assetType,
    quantity: transaction.quantity,
    price_native: transaction.priceNative,
    native_currency: transaction.nativeCurrency as 'CAD' | 'USD',
    fx_rate_to_cad: transaction.fxRateToCad,
    price_cad: transaction.priceCad,
    total_cad: transaction.totalCad,
    realized_gain_loss_cad: transaction.realizedGainLossCad ?? null,
    quote_timestamp: transaction.quoteTimestamp,
    purchase_date: transaction.purchaseDate,
    is_time_traveled: transaction.isTimeTraveled,
  });

  // 2. Update portfolio cash + realized G/L.
  await supabase
    .from('portfolios')
    .update({
      cash_cad: portfolio.cashCad,
      realized_gain_loss_cad: portfolio.realizedGainLossCad,
      updated_at: new Date().toISOString(),
    })
    .eq('id', portfolioId);

  // 3. Sync holdings via the shared upsert helper. Same pattern as
  // persistHoldingsRefresh — DELETE+INSERT used to race and produce
  // duplicate rows; UPSERT on (portfolio_id, symbol) is idempotent.
  await persistHoldingsRefresh(supabase, {
    userId,
    portfolioId,
    holdings: portfolio.holdings,
  });

  // 4. Insert snapshot.
  await supabase.from('portfolio_snapshots').insert({
    portfolio_id: portfolioId,
    user_id: userId,
    total_value_cad: snapshot.totalValueCad,
    cash_cad: snapshot.cashCad,
    invested_value_cad: snapshot.investedValueCad,
    total_return_cad: snapshot.totalReturnCad,
    total_return_percent: snapshot.totalReturnPercent,
  });
}

// Lighter-touch version of persistAfterTrade — only refreshes the holdings
// table (with updated prices/sector). Used by refreshHoldingQuotes so the
// freshness + sector backfill persists across page reloads / devices.
//
// Uses UPSERT on (portfolio_id, symbol) instead of DELETE+INSERT to avoid
// the race condition where two concurrent calls would interleave their
// DELETE and INSERT and produce duplicate rows. We also delete any rows
// for symbols that aren't in the current portfolio (sold positions),
// scoped to this portfolio_id, so the table stays in sync.
export async function persistHoldingsRefresh(
  supabase: DB,
  args: {
    userId: string;
    portfolioId: string;
    holdings: Holding[];
  },
): Promise<void> {
  const { userId, portfolioId, holdings } = args;

  if (holdings.length === 0) {
    await supabase.from('holdings').delete().eq('portfolio_id', portfolioId);
    return;
  }

  // Upsert current open positions. The unique index on
  // (portfolio_id, symbol) means an existing row with the same key is
  // updated in place rather than producing a duplicate.
  await supabase.from('holdings').upsert(
    holdings.map((h) => ({
      portfolio_id: portfolioId,
      user_id: userId,
      symbol: h.symbol,
      asset_name: h.assetName,
      asset_type: h.assetType,
      exchange: h.exchange ?? null,
      sector: h.sector ?? null,
      quantity: h.quantity,
      average_cost_cad: h.averageCostCad,
      current_price_native: h.currentPriceNative,
      current_price_cad: h.currentPriceCad,
      native_currency: h.nativeCurrency as 'CAD' | 'USD',
      fx_rate_to_cad: h.fxRateToCad,
      last_quote_at: h.lastQuoteAt || null,
      quote_freshness: h.quoteFreshness ?? null,
      first_purchase_date: h.firstPurchaseDate ?? null,
    })),
    { onConflict: 'portfolio_id,symbol' },
  );

  // Remove any rows for symbols that no longer appear in the portfolio
  // (e.g., a position closed in another tab). Scope strictly to this
  // portfolio so we never touch another user's data.
  const keepSymbols = holdings.map((h) => h.symbol);
  await supabase
    .from('holdings')
    .delete()
    .eq('portfolio_id', portfolioId)
    .not('symbol', 'in', `(${keepSymbols.map((s) => `"${s}"`).join(',')})`);
}

export async function persistWarning(
  supabase: DB,
  args: {
    userId: string;
    portfolioId: string;
    warning: RiskWarning;
  },
): Promise<void> {
  const { userId, portfolioId, warning } = args;
  await supabase.from('risk_warnings').insert({
    id: warning.id,
    portfolio_id: portfolioId,
    user_id: userId,
    type: warning.type,
    severity: warning.severity,
    title: warning.title,
    message: warning.message,
    related_symbol: warning.relatedSymbol ?? null,
    related_learning_slugs: warning.relatedLearningSlugs ?? [],
    acknowledged: warning.acknowledged,
  });
}

export async function persistAcknowledgeWarning(
  supabase: DB,
  warningId: string,
): Promise<void> {
  await supabase
    .from('risk_warnings')
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', warningId);
}

export async function persistDisplayName(
  supabase: DB,
  userId: string,
  displayName: string,
): Promise<void> {
  await supabase
    .from('profiles')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function persistMarketDataMode(
  supabase: DB,
  portfolioId: string,
  mode: MarketDataMode,
): Promise<void> {
  await supabase
    .from('portfolios')
    .update({ market_data_mode: mode, updated_at: new Date().toISOString() })
    .eq('id', portfolioId);
}

// ---------------------------------------------------------------------------
// Reset (PRD §34.10)
// ---------------------------------------------------------------------------

export async function resetPortfolioInSupabase(
  supabase: DB,
  args: { userId: string; portfolioId: string; initialSnapshot: PortfolioSnapshot },
): Promise<void> {
  const { userId, portfolioId, initialSnapshot } = args;

  // Delete dependent rows.
  await Promise.all([
    supabase.from('holdings').delete().eq('portfolio_id', portfolioId),
    supabase.from('transactions').delete().eq('portfolio_id', portfolioId),
    supabase
      .from('portfolio_snapshots')
      .delete()
      .eq('portfolio_id', portfolioId),
    supabase.from('risk_warnings').delete().eq('portfolio_id', portfolioId),
  ]);

  // Reset cash + realized G/L on portfolio.
  await supabase
    .from('portfolios')
    .update({
      cash_cad: STARTING_BALANCE_CAD,
      realized_gain_loss_cad: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', portfolioId);

  // Seed fresh initial snapshot.
  await supabase.from('portfolio_snapshots').insert({
    portfolio_id: portfolioId,
    user_id: userId,
    total_value_cad: initialSnapshot.totalValueCad,
    cash_cad: initialSnapshot.cashCad,
    invested_value_cad: initialSnapshot.investedValueCad,
    total_return_cad: initialSnapshot.totalReturnCad,
    total_return_percent: initialSnapshot.totalReturnPercent,
  });
}
