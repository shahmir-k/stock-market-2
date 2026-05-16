'use client';

// Polling hook used by Dashboard + Portfolio per PRD §16. Refreshes holding
// quotes every `intervalMs` while the page is mounted.

import { useEffect } from 'react';

import { useSimulatorStore } from '@/store/simulatorStore';

export function useQuoteRefresh(intervalMs = 3 * 60 * 1000) {
  const refreshHoldingQuotes = useSimulatorStore(
    (s) => s.refreshHoldingQuotes,
  );
  useEffect(() => {
    void refreshHoldingQuotes();
    const id = window.setInterval(() => {
      void refreshHoldingQuotes();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [refreshHoldingQuotes, intervalMs]);
}
