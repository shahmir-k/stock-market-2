'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Eyebrow } from '@/components/common/Eyebrow';
import { getTermBySlug } from '@/lib/learning';

import { LearningTermDetail } from './LearningTermDetail';

// When this context is non-null, in-page learning links route through the
// drawer instead of navigating. Used inside trade modals so the trade input
// is preserved (PRD §31.3).
type LearningDrawerCtx = {
  openDrawer: (slug: string) => void;
};

const LearningDrawerContext = createContext<LearningDrawerCtx | null>(null);

export function useLearningDrawer(): LearningDrawerCtx | null {
  return useContext(LearningDrawerContext);
}

export function LearningDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const openDrawer = useCallback((slug: string) => {
    setOpenSlug(slug);
  }, []);

  const closeDrawer = useCallback(() => {
    setOpenSlug(null);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openSlug && !dialog.open) dialog.showModal();
    else if (!openSlug && dialog.open) dialog.close();
  }, [openSlug]);

  const term = openSlug ? getTermBySlug(openSlug) : null;

  return (
    <LearningDrawerContext.Provider value={{ openDrawer }}>
      {children}
      <dialog
        ref={dialogRef}
        onClose={closeDrawer}
        // Right-side editorial sheet. Thin left rule, bone background, no
        // bezel — feels like the drawer slid out from the side of a magazine.
        className="fixed right-0 top-0 ml-auto mr-0 h-screen max-h-screen w-[32rem] max-w-[calc(100vw-2rem)] rounded-none border-l rule bg-canvas p-0 shadow-[-30px_0_80px_-20px_rgba(0,0,0,0.12)] backdrop:bg-ink/30"
        aria-label="Learning term"
      >
        <div className="flex h-full flex-col">
          <header className="flex items-baseline justify-between border-b rule px-8 py-5">
            <Eyebrow>Learn</Eyebrow>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close"
              className="text-sm text-text-secondary hover:text-ink transition-colors duration-[var(--dur-fast)]"
            >
              Close
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-8 py-8">
            {term ? (
              <LearningTermDetail term={term} />
            ) : (
              <p className="text-sm text-text-secondary">Term not found.</p>
            )}
          </div>
        </div>
      </dialog>
    </LearningDrawerContext.Provider>
  );
}
