'use client';

import { useSimulatorStore } from '@/store/simulatorStore';
import type { SyncStatus } from '@/types/portfolio';

const STYLES: Record<SyncStatus, { label: string; className: string }> = {
  SYNCED: { label: 'Saved', className: 'text-text-muted' },
  SYNCING: { label: 'Saving…', className: 'text-info' },
  UNSYNCED: { label: 'Unsaved changes', className: 'text-warning' },
  ERROR: { label: 'Save failed', className: 'text-danger' },
};

export function SyncStatusBadge() {
  const status = useSimulatorStore((s) => s.syncStatus);
  const meta = STYLES[status];
  return <span className={`text-xs ${meta.className}`}>{meta.label}</span>;
}
