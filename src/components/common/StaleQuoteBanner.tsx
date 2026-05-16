'use client';

import {
  selectHoldingsWithAnalytics,
  useSimulatorStore,
} from '@/store/simulatorStore';

export function StaleQuoteBanner() {
  const holdings = useSimulatorStore(selectHoldingsWithAnalytics);
  const stale = holdings.some(
    (h) => h.quoteFreshness === 'STALE' || h.quoteFreshness === 'UNAVAILABLE',
  );
  if (!stale) return null;
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-2 text-sm text-text-secondary">
      Some quotes could not be refreshed. Stale prices are being shown.
    </div>
  );
}
