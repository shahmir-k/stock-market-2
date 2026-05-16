'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useSimulatorStore } from '@/store/simulatorStore';
import type { MarketDataMode } from '@/types/portfolio';

export default function SettingsPage() {
  const router = useRouter();
  const user = useSimulatorStore((s) => s.user);
  const marketDataMode = useSimulatorStore((s) => s.marketDataMode);
  const holdings = useSimulatorStore((s) => s.portfolio.holdings);
  const setDisplayName = useSimulatorStore((s) => s.setDisplayName);
  const setMarketDataMode = useSimulatorStore((s) => s.setMarketDataMode);
  const resetSimulation = useSimulatorStore((s) => s.resetSimulation);

  const [name, setName] = useState(user?.displayName ?? '');
  const [resetOpen, setResetOpen] = useState(false);
  const [modeSwitchTarget, setModeSwitchTarget] =
    useState<MarketDataMode | null>(null);
  const [resetting, setResetting] = useState(false);

  const onSaveName = () => {
    setDisplayName(name.trim());
  };

  const onSelectMode = (mode: MarketDataMode) => {
    if (mode === marketDataMode) return;
    if (holdings.length > 0) {
      setModeSwitchTarget(mode);
    } else {
      setMarketDataMode(mode);
    }
  };

  const confirmModeSwitch = () => {
    if (modeSwitchTarget) {
      setMarketDataMode(modeSwitchTarget);
      setModeSwitchTarget(null);
    }
  };

  const onConfirmReset = async () => {
    setResetting(true);
    await resetSimulation();
    setResetting(false);
    setResetOpen(false);
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Display Name</h2>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
            placeholder="BeginnerInvestor"
          />
          <button
            type="button"
            onClick={onSaveName}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Save
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Data Mode</h2>
        <p className="mt-1 text-sm text-text-secondary">
          API uses live market data. Mock uses built-in fixtures (good for
          demos and offline use).
        </p>
        <div className="mt-3 flex gap-2">
          {(['API', 'MOCK'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSelectMode(mode)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                marketDataMode === mode
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-primary hover:bg-surface-muted'
              }`}
            >
              {mode === 'API' ? 'API Data' : 'Mock Data'}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Simulation</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Starting Balance</dt>
            <dd className="font-medium">$5,000 CAD</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">Fractional Shares</dt>
            <dd className="font-medium">Enabled</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">Crypto / Options / Margin / Shorting</dt>
            <dd className="font-medium">Disabled</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Disclaimer</h2>
        <p className="mt-2 text-sm text-text-secondary">
          This simulator uses virtual money only and does not provide
          financial advice.
        </p>
      </section>

      <section className="rounded-xl border border-danger/30 bg-danger/5 p-6">
        <h2 className="text-lg font-semibold text-danger">Danger Zone</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Reset clears your holdings, transactions, snapshots, and warnings,
          and restores your cash to $5,000 CAD. Display name and data mode
          are kept.
        </p>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="mt-4 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90"
        >
          Reset Simulation
        </button>
      </section>

      <ConfirmModal
        open={resetOpen}
        title="Reset Simulation?"
        description="This will clear your holdings, transactions, snapshots, and warnings, and restore your cash to $5,000 CAD."
        confirmLabel={resetting ? 'Resetting…' : 'Reset'}
        destructive
        onConfirm={() => {
          void onConfirmReset();
        }}
        onCancel={() => setResetOpen(false)}
      />

      <ConfirmModal
        open={modeSwitchTarget !== null}
        title="Switch data mode?"
        description="Switching data modes may change displayed prices for your holdings. Your transaction history will remain unchanged."
        confirmLabel="Switch"
        onConfirm={confirmModeSwitch}
        onCancel={() => setModeSwitchTarget(null)}
      />
    </div>
  );
}
