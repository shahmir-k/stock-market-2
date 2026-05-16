'use client';

import { useEffect } from 'react';

import { useSimulatorStore } from '@/store/simulatorStore';

import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { SidebarNav } from './SidebarNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const loadState = useSimulatorStore((s) => s.loadState);
  const isHydrated = useSimulatorStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      void loadState();
    }
  }, [isHydrated, loadState]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <SidebarNav />
        <main className="flex-1 px-4 pb-24 pt-6 md:px-6 md:pb-6">
          <div className="mx-auto w-full max-w-(--container-page)">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
