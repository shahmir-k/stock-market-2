// Zustand simulator store per PRD §27.
//
// Source of truth for client-side simulator state. Components subscribe via
// `useSimulatorStore(selectFoo)`. Components must NEVER mutate state
// directly — all changes go through actions defined here.
//
// Persistence layering:
//   - localStorage: recovery cache (this module writes here on every action).
//   - Supabase: durable source of truth (T-059..T-061 wire writes).
//
// Market data:
//   - Currently calls mockMarketDataProvider directly. T-040 swaps this for
//     a provider abstraction that switches between mock and Twelve Data based
//     on `marketDataMode`.

import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

import {
  holdingAllocationPercent,
  holdingMarketValue,
  holdingUnrealizedGainLoss,
  holdingUnrealizedGainLossPercent,
  investedValueCad,
  portfolioValueCad,
  totalReturnCad,
  totalReturnPercent,
  unrealizedGainLossTotalCad,
} from '@/lib/calculations/portfolio';
import { calculateDiversification } from '@/lib/diversification';
import { getProvider } from '@/lib/market-data/provider';
import {
  evaluatePostTradeWarnings,
  evaluatePreTradeWarnings,
  novelWarnings,
} from '@/lib/risk';
import {
  DEFAULT_SIMULATION_CONFIG,
  STARTING_BALANCE_CAD,
  makeInitialPortfolio,
} from '@/lib/persistence/initialState';
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  clearLocalStorage,
  type PersistedState,
} from '@/lib/persistence/localStorage';
import {
  loadFromSupabase,
  persistAcknowledgeWarning,
  persistAfterTrade,
  persistDisplayName,
  persistHoldingsRefresh,
  persistMarketDataMode,
  persistWarning,
  resetPortfolioInSupabase,
} from '@/lib/persistence/supabaseSync';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { applyBuy, applySell } from '@/lib/trading/apply';
import { buildBuyPreview } from '@/lib/trading/buy';
import { TradeValidationError } from '@/lib/trading/errors';
import { buildSellPreview } from '@/lib/trading/sell';
import type {
  AssetSearchResult,
  FxResponseData,
  QuoteResponseData,
} from '@/types/market';
import type {
  AuthSessionStatus,
  Holding,
  LocalUser,
  MarketDataMode,
  Portfolio,
  PortfolioSnapshot,
  RiskWarning,
  SimulationConfig,
  SyncStatus,
  Transaction,
} from '@/types/portfolio';
import type {
  BuyOrderInput,
  SellOrderInput,
  TradePreview,
  TradeResult,
} from '@/types/trading';

// ---------------------------------------------------------------------------
// State + Actions types (PRD §27.1, §27.2)
// ---------------------------------------------------------------------------

export type SimulatorStoreState = {
  version: number;
  user: LocalUser | null;
  portfolioId: string | null;
  authSessionStatus: AuthSessionStatus;
  simulation: SimulationConfig;
  portfolio: Portfolio;
  warnings: RiskWarning[];
  marketDataMode: MarketDataMode;
  syncStatus: SyncStatus;
  fxRateUsdCad: number | null;
  isHydrated: boolean;
  recoveryNeeded: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SimulatorStoreActions = {
  initializeSimulation(displayName?: string): Promise<void>;
  loadState(): Promise<void>;
  saveState(): Promise<void>;
  syncFromSupabase(): Promise<void>;
  syncToSupabase(): Promise<void>;
  resetSimulation(): Promise<void>;

  setDisplayName(displayName: string): void;
  setMarketDataMode(mode: MarketDataMode): void;
  setAuthSessionStatus(status: AuthSessionStatus): void;

  searchAssets(query: string): Promise<AssetSearchResult[]>;
  getQuote(symbol: string, exchange?: string): Promise<QuoteResponseData>;
  refreshHoldingQuotes(): Promise<void>;
  refreshFxRate(from: 'USD', to: 'CAD'): Promise<FxResponseData>;

  previewBuy(order: BuyOrderInput): Promise<TradePreview>;
  executeBuy(preview: TradePreview): Promise<TradeResult>;
  previewSell(order: SellOrderInput): Promise<TradePreview>;
  executeSell(preview: TradePreview): Promise<TradeResult>;

  acknowledgeWarning(warningId: string): void;
  clearInactiveWarnings(): void;
};

export type SimulatorStore = SimulatorStoreState & SimulatorStoreActions;

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

function makeInitialState(): SimulatorStoreState {
  const now = new Date().toISOString();
  return {
    version: 1,
    user: null,
    portfolioId: null,
    authSessionStatus: 'LOADING',
    simulation: DEFAULT_SIMULATION_CONFIG,
    portfolio: makeInitialPortfolio(STARTING_BALANCE_CAD, now),
    warnings: [],
    marketDataMode: 'API',
    syncStatus: 'SYNCED',
    fxRateUsdCad: null,
    isHydrated: false,
    recoveryNeeded: false,
    createdAt: now,
    updatedAt: now,
  };
}

// Returns the configured Supabase browser client, or null if env vars missing.
function maybeSupabase() {
  try {
    return getSupabaseBrowserClient();
  } catch {
    return null;
  }
}

// Module-level guard so concurrent callers of syncFromSupabase share one
// network round-trip and one bootstrap insert. See syncFromSupabase action.
let inFlightSync: Promise<void> | null = null;

// Same pattern for refreshHoldingQuotes — React StrictMode + page-mount
// effect + marketDataMode dep change can fire this two or three times in
// quick succession. Without dedupe, each call did its own DELETE+INSERT
// against the holdings table and concurrent inserts produced duplicate
// rows (which the in-memory state then double-counted as portfolio value).
let inFlightHoldingsRefresh: Promise<void> | null = null;

function toPersisted(s: SimulatorStoreState): PersistedState {
  return {
    version: s.version,
    user: s.user,
    simulation: s.simulation,
    portfolio: s.portfolio,
    warnings: s.warnings,
    marketDataMode: s.marketDataMode,
    fxRateUsdCad: s.fxRateUsdCad,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

// Provider selection now lives in src/lib/market-data/provider.ts and
// switches between Twelve Data (via internal API routes) and the mock
// fixtures based on `marketDataMode`.

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSimulatorStore = create<SimulatorStore>()((set, get) => ({
  ...makeInitialState(),

  // -------- lifecycle ------------------------------------------------------

  initializeSimulation: async (displayName) => {
    const now = new Date().toISOString();
    const user: LocalUser = { id: uuidv4(), displayName };
    set({
      user,
      portfolio: makeInitialPortfolio(STARTING_BALANCE_CAD, now),
      warnings: [],
      createdAt: now,
      updatedAt: now,
      isHydrated: true,
      recoveryNeeded: false,
    });
    await get().saveState();
  },

  loadState: async () => {
    // Try Supabase first; fall back to localStorage if no auth/Supabase config.
    const supabase = maybeSupabase();
    if (supabase) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user?.id) {
          await get().syncFromSupabase();
          return;
        }
        set({ authSessionStatus: 'UNAUTHENTICATED' });
      } catch {
        // Fall through to localStorage.
      }
    }

    const result = loadFromLocalStorage();
    if (result.ok) {
      set({
        version: result.state.version,
        user: result.state.user,
        simulation: result.state.simulation,
        portfolio: result.state.portfolio,
        warnings: result.state.warnings,
        marketDataMode: result.state.marketDataMode,
        fxRateUsdCad: result.state.fxRateUsdCad,
        createdAt: result.state.createdAt,
        updatedAt: result.state.updatedAt,
        isHydrated: true,
        recoveryNeeded: false,
      });
    } else if (result.reason === 'CORRUPTED' || result.reason === 'VERSION_MISMATCH') {
      set({ isHydrated: true, recoveryNeeded: true });
    } else {
      set({ isHydrated: true });
    }
  },

  saveState: async () => {
    saveToLocalStorage(toPersisted(get()));
  },

  syncFromSupabase: async () => {
    // Dedupe concurrent calls. React StrictMode mounts effects twice in dev,
    // and multiple components (AppShell + page) may each kick off a load. Without
    // this guard, the bootstrap insert into profiles/portfolios races and 409s.
    if (inFlightSync) {
      await inFlightSync;
      return;
    }
    const promise = (async () => {
      const supabase = maybeSupabase();
      if (!supabase) return;
      set({ syncStatus: 'SYNCING' });
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user?.id) {
          set({ authSessionStatus: 'UNAUTHENTICATED', isHydrated: true });
          return;
        }
        const loaded = await loadFromSupabase(
          supabase,
          userData.user.id,
          userData.user.email ?? '',
        );
        set({
          user: loaded.user,
          portfolioId: loaded.portfolioId,
          portfolio: loaded.portfolio,
          warnings: loaded.warnings,
          marketDataMode: loaded.marketDataMode,
          authSessionStatus: 'AUTHENTICATED',
          syncStatus: 'SYNCED',
          isHydrated: true,
          updatedAt: new Date().toISOString(),
        });
        void get().saveState();
      } catch {
        set({ syncStatus: 'ERROR', isHydrated: true });
      }
    })();
    inFlightSync = promise;
    try {
      await promise;
    } finally {
      inFlightSync = null;
    }
  },

  syncToSupabase: async () => {
    // Per-mutation writes (executeBuy/executeSell/etc) handle persistence.
    // This action is exposed for parity with PRD §27.2 but is a no-op.
    set({ syncStatus: 'SYNCED' });
  },

  resetSimulation: async () => {
    const now = new Date().toISOString();
    const current = get();
    const fresh = makeInitialPortfolio(STARTING_BALANCE_CAD, now);

    set({
      portfolio: fresh,
      warnings: [],
      updatedAt: now,
      user: current.user,
      marketDataMode: current.marketDataMode,
      recoveryNeeded: false,
      syncStatus: 'SYNCING',
    });
    clearLocalStorage();
    await get().saveState();

    const supabase = maybeSupabase();
    if (supabase && current.user && current.portfolioId) {
      try {
        await resetPortfolioInSupabase(supabase, {
          userId: current.user.id,
          portfolioId: current.portfolioId,
          initialSnapshot: fresh.snapshots[0],
        });
        set({ syncStatus: 'SYNCED' });
      } catch {
        set({ syncStatus: 'ERROR' });
      }
    } else {
      set({ syncStatus: 'SYNCED' });
    }
  },

  // -------- settings -------------------------------------------------------

  setDisplayName: (displayName) => {
    const user = get().user;
    if (!user) return;
    set({
      user: { ...user, displayName },
      updatedAt: new Date().toISOString(),
    });
    void get().saveState();
    const supabase = maybeSupabase();
    if (supabase) {
      void persistDisplayName(supabase, user.id, displayName);
    }
  },

  setMarketDataMode: (mode) => {
    const portfolioId = get().portfolioId;
    set({ marketDataMode: mode, updatedAt: new Date().toISOString() });
    void get().saveState();
    const supabase = maybeSupabase();
    if (supabase && portfolioId) {
      void persistMarketDataMode(supabase, portfolioId, mode);
    }
  },

  setAuthSessionStatus: (status) => {
    set({ authSessionStatus: status });
  },

  // -------- market data ----------------------------------------------------

  searchAssets: async (query) => {
    const provider = getProvider(get().marketDataMode);
    return provider.searchSymbols(query);
  },

  getQuote: async (symbol) => {
    const provider = getProvider(get().marketDataMode);
    const q = await provider.getQuote(symbol);
    if (!q) {
      throw new TradeValidationError(
        'NO_QUOTE',
        'Quote unavailable for this asset.',
      );
    }
    return q;
  },

  refreshHoldingQuotes: async () => {
    // Dedupe concurrent callers. Without this, StrictMode + the page-mount
    // useEffect + a marketDataMode dep change can fire 2–3 times in quick
    // succession, each one DELETE+INSERT-ing the holdings table and
    // racing into duplicate rows.
    if (inFlightHoldingsRefresh) {
      await inFlightHoldingsRefresh;
      return;
    }
    const promise = (async () => {
      const provider = getProvider(get().marketDataMode);
      const holdings = get().portfolio.holdings;
      if (holdings.length === 0) return;
      const symbols = holdings.map((h) => h.symbol);
      const quotes = await provider.getQuotes(symbols);
      const quoteBySymbol = new Map(quotes.map((q) => [q.symbol, q]));

    // FX rate refresh — needed for USD assets.
    const needsUsdFx = holdings.some((h) => h.nativeCurrency === 'USD');
    let usdCad = get().fxRateUsdCad;
    if (needsUsdFx) {
      const fx = await provider.getExchangeRate('USD', 'CAD');
      if (fx) usdCad = fx.rate;
    }

    // Backfill sector for holdings that don't have one (Twelve Data's quote
    // endpoint doesn't return sector — needs a separate /profile call). Skip
    // if the quote already supplied a sector (mock provider does).
    const needProfile = holdings.filter(
      (h) => !h.sector && !quoteBySymbol.get(h.symbol)?.sector,
    );
    const profiles = await Promise.all(
      needProfile.map(async (h) => ({
        symbol: h.symbol,
        profile: await provider.getProfile(h.symbol).catch(() => null),
      })),
    );
    const sectorBySymbol = new Map(
      profiles.map((p) => [p.symbol, p.profile?.sector]),
    );

    const updatedHoldings: Holding[] = holdings.map((h) => {
      const q = quoteBySymbol.get(h.symbol);
      if (!q) return h;
      const fxRate = h.nativeCurrency === 'CAD' ? 1 : usdCad ?? h.fxRateToCad;
      const priceCad = h.nativeCurrency === 'CAD' ? q.priceNative : q.priceNative * fxRate;
      return {
        ...h,
        currentPriceNative: q.priceNative,
        currentPriceCad: priceCad,
        fxRateToCad: fxRate,
        lastQuoteAt: q.quoteTimestamp,
        quoteFreshness: q.freshness,
        sector: h.sector ?? q.sector ?? sectorBySymbol.get(h.symbol),
      };
    });

    set({
      portfolio: { ...get().portfolio, holdings: updatedHoldings },
      fxRateUsdCad: usdCad,
      updatedAt: new Date().toISOString(),
    });
    void get().saveState();

    // Persist updated holdings (with sector + fresh prices) back to Supabase
    // so the values survive a hard reload from a different device.
    const supabase = maybeSupabase();
    const userId = get().user?.id;
    const portfolioId = get().portfolioId;
      if (supabase && userId && portfolioId) {
        try {
          await persistHoldingsRefresh(supabase, {
            userId,
            portfolioId,
            holdings: updatedHoldings,
          });
        } catch {
          // Non-fatal — local state still updated.
        }
      }
    })();
    inFlightHoldingsRefresh = promise;
    try {
      await promise;
    } finally {
      inFlightHoldingsRefresh = null;
    }
  },

  refreshFxRate: async (from, to) => {
    const provider = getProvider(get().marketDataMode);
    const fx = await provider.getExchangeRate(from, to);
    if (!fx) {
      throw new Error('FX rate unavailable');
    }
    if (from === 'USD' && to === 'CAD') {
      set({ fxRateUsdCad: fx.rate });
      void get().saveState();
    }
    return fx;
  },

  // -------- trading --------------------------------------------------------

  previewBuy: async (order) => {
    const provider = getProvider(get().marketDataMode);
    const quote = await provider.getQuote(order.symbol);
    if (!quote) {
      throw new TradeValidationError(
        'NO_QUOTE',
        'Quote unavailable for this asset.',
      );
    }
    let fxRate: number | null = null;
    if (quote.currency === 'CAD') {
      fxRate = 1;
    } else {
      const fx = await provider.getExchangeRate(quote.currency, 'CAD');
      fxRate = fx?.rate ?? get().fxRateUsdCad;
    }
    const draft = buildBuyPreview({
      order,
      quote,
      fxRate,
      currentCashCad: get().portfolio.cashCad,
      warnings: [],
    });
    const warnings = evaluatePreTradeWarnings(get().portfolio, draft);
    return { ...draft, warnings };
  },

  executeBuy: async (preview) => {
    try {
      const result = applyBuy(get().portfolio, preview);
      const fresh = evaluatePostTradeWarnings(result.portfolio);
      const novel = novelWarnings(get().warnings, fresh);
      set({
        portfolio: result.portfolio,
        warnings: [...get().warnings, ...novel],
        updatedAt: new Date().toISOString(),
        syncStatus: 'SYNCING',
      });
      await get().saveState();

      const supabase = maybeSupabase();
      const userId = get().user?.id;
      const portfolioId = get().portfolioId;
      if (supabase && userId && portfolioId) {
        try {
          await persistAfterTrade(supabase, {
            userId,
            portfolioId,
            portfolio: result.portfolio,
            transaction: result.transaction,
            snapshot: result.snapshot,
          });
          for (const w of novel) {
            await persistWarning(supabase, { userId, portfolioId, warning: w });
          }
          set({ syncStatus: 'SYNCED' });
        } catch {
          set({ syncStatus: 'ERROR' });
        }
      } else {
        set({ syncStatus: 'SYNCED' });
      }

      return { success: true, transaction: result.transaction };
    } catch (err) {
      return {
        success: false,
        errors: [err instanceof Error ? err.message : 'Trade failed'],
      };
    }
  },

  previewSell: async (order) => {
    const provider = getProvider(get().marketDataMode);
    const holding = get().portfolio.holdings.find(
      (h) => h.symbol === order.symbol,
    );
    if (!holding) {
      throw new TradeValidationError(
        'NOT_OWNED',
        'You do not own this asset.',
      );
    }
    const quote = await provider.getQuote(order.symbol);
    if (!quote) {
      throw new TradeValidationError(
        'NO_QUOTE',
        'Quote unavailable for this asset.',
      );
    }
    let fxRate: number | null = null;
    if (quote.currency === 'CAD') {
      fxRate = 1;
    } else {
      const fx = await provider.getExchangeRate(quote.currency, 'CAD');
      fxRate = fx?.rate ?? get().fxRateUsdCad;
    }
    const draft = buildSellPreview({
      order,
      quote,
      fxRate,
      holding,
      currentCashCad: get().portfolio.cashCad,
      warnings: [],
    });
    const warnings = evaluatePreTradeWarnings(get().portfolio, draft);
    return { ...draft, warnings };
  },

  executeSell: async (preview) => {
    try {
      const result = applySell(get().portfolio, preview);
      const fresh = evaluatePostTradeWarnings(result.portfolio);
      const novel = novelWarnings(get().warnings, fresh);
      set({
        portfolio: result.portfolio,
        warnings: [...get().warnings, ...novel],
        updatedAt: new Date().toISOString(),
        syncStatus: 'SYNCING',
      });
      await get().saveState();

      const supabase = maybeSupabase();
      const userId = get().user?.id;
      const portfolioId = get().portfolioId;
      if (supabase && userId && portfolioId) {
        try {
          await persistAfterTrade(supabase, {
            userId,
            portfolioId,
            portfolio: result.portfolio,
            transaction: result.transaction,
            snapshot: result.snapshot,
          });
          for (const w of novel) {
            await persistWarning(supabase, { userId, portfolioId, warning: w });
          }
          set({ syncStatus: 'SYNCED' });
        } catch {
          set({ syncStatus: 'ERROR' });
        }
      } else {
        set({ syncStatus: 'SYNCED' });
      }

      return { success: true, transaction: result.transaction };
    } catch (err) {
      return {
        success: false,
        errors: [err instanceof Error ? err.message : 'Trade failed'],
      };
    }
  },

  // -------- warnings -------------------------------------------------------

  acknowledgeWarning: (warningId) => {
    const now = new Date().toISOString();
    set({
      warnings: get().warnings.map((w) =>
        w.id === warningId ? { ...w, acknowledged: true } : w,
      ),
      updatedAt: now,
    });
    void get().saveState();
    const supabase = maybeSupabase();
    if (supabase) {
      void persistAcknowledgeWarning(supabase, warningId);
    }
  },

  clearInactiveWarnings: () => {
    set({
      warnings: get().warnings.filter((w) => !w.acknowledged),
      updatedAt: new Date().toISOString(),
    });
    void get().saveState();
  },
}));

// ---------------------------------------------------------------------------
// Selectors (PRD §27.3)
// ---------------------------------------------------------------------------
//
// Derived selectors (arrays/objects) MUST return a stable reference when their
// inputs are unchanged. Without memoization, React 19 + Zustand v5's
// useSyncExternalStore loops: selector returns a new array → React thinks
// state changed → re-render → selector → new array again ("getSnapshot should
// be cached to avoid an infinite loop"). `memoOn` caches by the input
// reference, so a selector watching `s.warnings` only recomputes when the
// warnings array reference itself changes.

function memoOn<K, R>(
  pick: (s: SimulatorStoreState) => K,
  compute: (s: SimulatorStoreState) => R,
): (s: SimulatorStoreState) => R {
  let lastKey: K | undefined;
  let lastResult: R;
  let primed = false;
  return (s) => {
    const key = pick(s);
    if (primed && key === lastKey) return lastResult;
    lastKey = key;
    lastResult = compute(s);
    primed = true;
    return lastResult;
  };
}

export type HoldingWithAnalytics = Holding & {
  marketValueCad: number;
  costBasisCad: number;
  unrealizedGainLossCad: number;
  unrealizedGainLossPercent: number;
  allocationPercent: number;
};

export type { DiversificationResult } from '@/lib/diversification';

export const selectCashCad = (s: SimulatorStoreState): number =>
  s.portfolio.cashCad;

export const selectInvestedValueCad = (s: SimulatorStoreState): number =>
  investedValueCad(s.portfolio.holdings);

export const selectPortfolioValueCad = (s: SimulatorStoreState): number =>
  portfolioValueCad(s.portfolio.cashCad, s.portfolio.holdings);

export const selectTotalReturnCad = (s: SimulatorStoreState): number =>
  totalReturnCad(
    portfolioValueCad(s.portfolio.cashCad, s.portfolio.holdings),
    s.portfolio.startingBalanceCad,
  );

export const selectTotalReturnPercent = (s: SimulatorStoreState): number =>
  totalReturnPercent(
    portfolioValueCad(s.portfolio.cashCad, s.portfolio.holdings),
    s.portfolio.startingBalanceCad,
  );

export const selectRealizedGainLossCad = (s: SimulatorStoreState): number =>
  s.portfolio.realizedGainLossCad;

export const selectUnrealizedGainLossCad = (s: SimulatorStoreState): number =>
  unrealizedGainLossTotalCad(s.portfolio.holdings);

export const selectHoldingsWithAnalytics = memoOn<unknown, HoldingWithAnalytics[]>(
  (s) => s.portfolio,
  (s) => {
    const total = portfolioValueCad(s.portfolio.cashCad, s.portfolio.holdings);
    return s.portfolio.holdings.map((h) => ({
      ...h,
      marketValueCad: holdingMarketValue(h),
      costBasisCad: h.quantity * h.averageCostCad,
      unrealizedGainLossCad: holdingUnrealizedGainLoss(h),
      unrealizedGainLossPercent: holdingUnrealizedGainLossPercent(h),
      allocationPercent: holdingAllocationPercent(h, total),
    }));
  },
);

export const selectRecentTransactions = memoOn<Transaction[], Transaction[]>(
  (s) => s.portfolio.transactions,
  (s) => [...s.portfolio.transactions].reverse(),
);

export const selectPortfolioSnapshots = (
  s: SimulatorStoreState,
): PortfolioSnapshot[] => s.portfolio.snapshots;

export const selectActiveWarnings = memoOn<RiskWarning[], RiskWarning[]>(
  (s) => s.warnings,
  (s) => s.warnings.filter((w) => !w.acknowledged),
);

export const selectAcknowledgedWarnings = memoOn<RiskWarning[], RiskWarning[]>(
  (s) => s.warnings,
  (s) => s.warnings.filter((w) => w.acknowledged),
);

export const selectDiversificationResult = memoOn(
  (s) => s.portfolio,
  (s) => calculateDiversification(s.portfolio.cashCad, s.portfolio.holdings),
);
