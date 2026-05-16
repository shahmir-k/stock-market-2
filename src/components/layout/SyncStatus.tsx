// Replaces the boxed SyncStatusBadge with a breathing-dot + text label.
// The dot uses the `breathe` keyframe (perpetual micro-motion from
// design-taste-frontend) when the data layer is live.

'use client';

import { useSimulatorStore } from '@/store/simulatorStore';
import type { SyncStatus as Status } from '@/types/portfolio';

const STYLES: Record<
  Status,
  { label: string; dot: string; breathe: boolean }
> = {
  SYNCED: {
    label: 'Saved',
    dot: 'bg-[var(--color-success)]',
    breathe: true,
  },
  SYNCING: {
    label: 'Saving',
    dot: 'bg-[var(--color-info)]',
    breathe: true,
  },
  UNSYNCED: {
    label: 'Unsaved',
    dot: 'bg-[var(--color-warning)]',
    breathe: false,
  },
  ERROR: {
    label: 'Save failed',
    dot: 'bg-[var(--color-danger)]',
    breathe: false,
  },
};

export function SyncStatus() {
  const status = useSimulatorStore((s) => s.syncStatus);
  const meta = STYLES[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot} ${
          meta.breathe ? 'breathe' : ''
        }`}
      />
      <span className="tracking-wide">{meta.label}</span>
    </span>
  );
}
