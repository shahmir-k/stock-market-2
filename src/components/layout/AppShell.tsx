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
    <div className="flex min-h-[100dvh] w-full flex-col">
      <Header />
      <div className="mx-auto flex w-full max-w-(--container-page) flex-1">
        <SidebarNav />
        <main className="flex-1 pb-32 pt-8 md:pb-12 md:pt-10 px-6 md:px-10">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
