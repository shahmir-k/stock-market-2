// Fallback sector lookup for the symbols most likely to be traded in the
// simulator. Twelve Data's /profile endpoint requires a paid plan, so for
// the MVP we hardcode the common cases here and fall back to "Unknown" for
// anything not in this map.
//
// Source: GICS sector classification (publicly available). Update as needed.

const SECTORS: Record<string, string> = {
  // --- Mega-cap US tech ---
  AAPL: 'Technology',
  MSFT: 'Technology',
  NVDA: 'Technology',
  GOOGL: 'Communication Services',
  GOOG: 'Communication Services',
  META: 'Communication Services',
  AMZN: 'Consumer Cyclical',
  TSLA: 'Consumer Cyclical',
  ORCL: 'Technology',
  CRM: 'Technology',
  ADBE: 'Technology',
  AMD: 'Technology',
  INTC: 'Technology',
  CSCO: 'Technology',
  IBM: 'Technology',

  // --- Financials ---
  JPM: 'Financial Services',
  BAC: 'Financial Services',
  WFC: 'Financial Services',
  GS: 'Financial Services',
  MS: 'Financial Services',
  BLK: 'Financial Services',
  V: 'Financial Services',
  MA: 'Financial Services',
  AXP: 'Financial Services',
  BRK: 'Financial Services',
  'BRK.A': 'Financial Services',
  'BRK.B': 'Financial Services',

  // --- Healthcare ---
  JNJ: 'Healthcare',
  PFE: 'Healthcare',
  LLY: 'Healthcare',
  UNH: 'Healthcare',
  ABBV: 'Healthcare',
  MRK: 'Healthcare',
  TMO: 'Healthcare',

  // --- Consumer ---
  KO: 'Consumer Defensive',
  PEP: 'Consumer Defensive',
  WMT: 'Consumer Defensive',
  COST: 'Consumer Defensive',
  PG: 'Consumer Defensive',
  MCD: 'Consumer Cyclical',
  NKE: 'Consumer Cyclical',
  HD: 'Consumer Cyclical',
  LOW: 'Consumer Cyclical',
  SBUX: 'Consumer Cyclical',
  DIS: 'Communication Services',
  NFLX: 'Communication Services',

  // --- Energy / Industrials ---
  XOM: 'Energy',
  CVX: 'Energy',
  BA: 'Industrials',
  CAT: 'Industrials',
  GE: 'Industrials',
  HON: 'Industrials',

  // --- US ETFs ---
  SPY: 'Diversified',
  IVV: 'Diversified',
  VOO: 'Diversified',
  QQQ: 'Technology',
  VTI: 'Diversified',
  VTV: 'Diversified',
  VUG: 'Diversified',
  VEA: 'Diversified',
  VWO: 'Diversified',
  AGG: 'Diversified',
  BND: 'Diversified',
  SCHD: 'Diversified',
  AAPD: 'Diversified',

  // --- Canadian banks (TSX) ---
  'RY.TO': 'Financial Services',
  'TD.TO': 'Financial Services',
  'BNS.TO': 'Financial Services',
  'BMO.TO': 'Financial Services',
  'CM.TO': 'Financial Services',
  'NA.TO': 'Financial Services',

  // --- Canadian energy ---
  'CNQ.TO': 'Energy',
  'SU.TO': 'Energy',
  'ENB.TO': 'Energy',
  'TRP.TO': 'Energy',

  // --- Canadian telecom / utilities ---
  'BCE.TO': 'Communication Services',
  'T.TO': 'Communication Services',
  'RCI.B.TO': 'Communication Services',
  'FTS.TO': 'Utilities',

  // --- Canadian ETFs ---
  'VFV.TO': 'Diversified',
  'XIC.TO': 'Diversified',
  'XIU.TO': 'Diversified',
  'VCN.TO': 'Diversified',
  'XAW.TO': 'Diversified',
  'VEQT.TO': 'Diversified',
  'XEQT.TO': 'Diversified',
  'ZSP.TO': 'Diversified',
  'HXS.TO': 'Diversified',
  'HXT.TO': 'Diversified',
};

export function getKnownSector(symbol: string): string | undefined {
  return SECTORS[symbol.toUpperCase()];
}
