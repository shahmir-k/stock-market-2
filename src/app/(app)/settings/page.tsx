'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Eyebrow } from '@/components/common/Eyebrow';
import { Field } from '@/components/common/Field';
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
    <div className="space-y-12">
      <section className="fade-up">
        <Eyebrow>Account</Eyebrow>
        <h1 className="font-display mt-3 text-5xl tracking-tight text-ink md:text-7xl">
          Settings.
        </h1>
      </section>

      {/* Display name */}
      <section className="fade-up border-t rule pt-10" style={{ animationDelay: '60ms' }}>
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <div>
            <Eyebrow>Display name</Eyebrow>
            <h2 className="font-display mt-2 text-2xl text-ink">
              What we call you
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-text-secondary">
              Shown in the dashboard greeting. Up to 30 characters.
            </p>
          </div>
          <div className="flex items-end gap-4">
            <Field
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="BeginnerInvestor"
              className="flex-1"
            />
            <Button variant="primary" size="md" onClick={onSaveName}>
              Save
            </Button>
          </div>
        </div>
      </section>

      {/* Data mode */}
      <section className="fade-up border-t rule pt-10" style={{ animationDelay: '120ms' }}>
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <div>
            <Eyebrow>Market data</Eyebrow>
            <h2 className="font-display mt-2 text-2xl text-ink">
              Live or mock
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-text-secondary">
              API uses live prices from Twelve Data. Mock uses deterministic
              built-in fixtures — useful for demos and offline development.
            </p>
          </div>
          <div className="flex items-baseline gap-6 text-sm">
            {(['API', 'MOCK'] as const).map((mode) => {
              const isActive = marketDataMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSelectMode(mode)}
                  className={`transition-colors duration-[var(--dur-fast)] ${
                    isActive
                      ? 'font-medium text-ink underline underline-offset-4 decoration-[var(--color-accent)]'
                      : 'text-text-secondary hover:text-ink'
                  }`}
                >
                  {mode === 'API' ? 'Live (API)' : 'Mock fixtures'}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simulation info */}
      <section className="fade-up border-t rule pt-10" style={{ animationDelay: '180ms' }}>
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <div>
            <Eyebrow>Simulation</Eyebrow>
            <h2 className="font-display mt-2 text-2xl text-ink">
              What&apos;s in play
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-text-secondary">
              Locked at MVP — these settings aren&apos;t user-configurable.
            </p>
          </div>
          <dl className="divide-y rule border-y text-sm">
            {[
              ['Starting balance', '$5,000 CAD'],
              ['Fractional shares', 'Enabled'],
              ['Asset classes', 'Stocks · ETFs'],
              ['Excluded', 'Crypto · Options · Margin · Shorting'],
              ['Multi-portfolio', 'One active portfolio per user'],
              ['Mode', 'Light only'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-3">
                <dt className="text-text-secondary">{k}</dt>
                <dd className="tabular text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="fade-up border-t rule pt-10" style={{ animationDelay: '240ms' }}>
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <div>
            <Eyebrow>Disclaimer</Eyebrow>
            <h2 className="font-display mt-2 text-2xl text-ink">Read this</h2>
          </div>
          <p className="max-w-prose text-sm leading-relaxed text-text-secondary">
            This simulator uses virtual money only. Prices and historical data
            are real, but the portfolio is a learning exercise — not financial
            advice, not a brokerage account, not a recommendation to invest.
          </p>
        </div>
      </section>

      {/* Danger zone */}
      <section className="fade-up border-t rule pt-10" style={{ animationDelay: '300ms' }}>
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <div>
            <Eyebrow>Danger zone</Eyebrow>
            <h2 className="font-display mt-2 text-2xl text-[var(--color-danger)]">
              Reset the simulation
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-text-secondary">
              Clears holdings, transactions, snapshots, and warnings. Cash
              returns to $5,000. Your display name, data mode, and learning
              progress are kept.
            </p>
          </div>
          <div className="flex items-start">
            <Button
              variant="primary"
              onClick={() => setResetOpen(true)}
              className="bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/85"
            >
              Reset simulation
            </Button>
          </div>
        </div>
      </section>

      <ConfirmModal
        open={resetOpen}
        title="Reset the simulation?"
        description="This clears your holdings, transactions, snapshots, and warnings, and restores your cash to $5,000 CAD."
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
        description="Switching modes may change displayed prices for your holdings. Your transaction history is unchanged."
        confirmLabel="Switch"
        onConfirm={confirmModeSwitch}
        onCancel={() => setModeSwitchTarget(null)}
      />
    </div>
  );
}
