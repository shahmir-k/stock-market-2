import Link from 'next/link';

import { Button } from '@/components/common/Button';
import { Eyebrow } from '@/components/common/Eyebrow';
import { GrainOverlay } from '@/components/common/GrainOverlay';

export default function LandingPage() {
  return (
    <main className="relative min-h-[100dvh] bg-canvas text-ink">
      <GrainOverlay />

      {/* Top bar — minimal: wordmark + sign-in link */}
      <header className="relative z-10 mx-auto flex max-w-(--container-page) items-center justify-between px-6 py-6 md:px-10">
        <span className="font-display text-lg tracking-tight">
          Stockletter
          <span className="text-text-muted"> · simulator</span>
        </span>
        <Link
          href="/auth/login"
          className="text-sm text-text-secondary hover:text-ink transition-colors duration-[var(--dur-fast)]"
        >
          Sign in
        </Link>
      </header>

      {/* Hero — editorial split with massive serif headline left, scope rules right */}
      <section className="relative z-10 mx-auto max-w-(--container-page) px-6 pt-12 pb-24 md:px-10 md:pt-20 md:pb-32">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:gap-16">
          <div className="fade-up">
            <Eyebrow>For people who&apos;ve never bought a stock</Eyebrow>
            <h1 className="font-display mt-5 text-5xl leading-[1.02] tracking-tight text-ink md:text-7xl">
              Learn the
              <br />
              market without
              <br />
              <span className="italic text-[var(--color-accent)]">
                losing real money.
              </span>
            </h1>
            <p className="mt-8 max-w-prose text-lg leading-relaxed text-text-secondary">
              A calm, single-player stock and ETF simulator. You start with
              $5,000 of virtual cash. Real prices, real lessons, no brokerage.
              It teaches as you trade — concentration risk, average cost,
              compound growth — without ever putting your money in the way of
              your education.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/auth/login">
                <Button variant="primary" size="lg">
                  Start with $5,000
                  <span className="ml-1 inline-block transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                    →
                  </span>
                </Button>
              </Link>
              <Link href="/learn">
                <Button variant="link" size="lg">
                  Read the glossary first
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-text-muted">
              Educational only — not financial advice. Virtual currency only.
            </p>
          </div>

          {/* Right side — scope table. Lives outside any card; just hairlines. */}
          <aside
            className="fade-up self-start md:mt-12"
            style={{ animationDelay: '120ms' }}
          >
            <Eyebrow>What you can do</Eyebrow>
            <ul className="mt-4 divide-y rule border-y">
              {[
                ['Buy & sell fractional shares', 'Stocks and ETFs'],
                ['Track average cost & realized P/L', 'Per holding'],
                ['See diversification & risk warnings', '7 trigger rules'],
                ['Back-test historical strategies', 'Real Twelve Data prices'],
                ['Learn 30 investing concepts', 'Inline drawer pattern'],
              ].map(([primary, secondary]) => (
                <li
                  key={primary}
                  className="flex items-baseline justify-between gap-4 py-3 text-sm"
                >
                  <span className="text-ink">{primary}</span>
                  <span className="text-xs text-text-muted">{secondary}</span>
                </li>
              ))}
            </ul>

            <Eyebrow className="mt-10">What it isn&apos;t</Eyebrow>
            <ul className="mt-4 space-y-2 text-sm text-text-secondary">
              <li>· No real money, ever</li>
              <li>· No crypto, options, margin, or shorting</li>
              <li>· No leaderboards or social features</li>
              <li>· No AI &ldquo;buy signals&rdquo;</li>
            </ul>
          </aside>
        </div>
      </section>

      {/* How it teaches — three columns of editorial copy, no boxed cards */}
      <section className="relative z-10 mx-auto max-w-(--container-page) px-6 pb-24 md:px-10 md:pb-32">
        <div className="border-t rule pt-12 md:pt-16">
          <Eyebrow>How it teaches</Eyebrow>
          <h2 className="font-display mt-3 text-3xl tracking-tight md:text-4xl">
            Three lessons, repeated every time you click&nbsp;
            <em className="text-[var(--color-accent)]">Buy</em>.
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-10">
            {[
              {
                kicker: 'Average cost basis',
                title: "You'll see the math.",
                body: "Buy two shares of the same stock at different prices and the simulator updates your blended cost in real time. The number isn't hidden behind a fee schedule.",
              },
              {
                kicker: 'Concentration risk',
                title: "You'll feel the warnings.",
                body: 'Put 60% into a single name and a calm note appears in the trade modal: "this puts most of your portfolio in one place." Educational, never blocking.',
              },
              {
                kicker: 'Time horizon',
                title: "You'll measure both ways.",
                body: 'A forward compound calculator and a real-history backtester sit on the same page. Project a future. Then check what actually would have happened.',
              },
            ].map((card, i) => (
              <article
                key={card.kicker}
                className="fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <Eyebrow>{card.kicker}</Eyebrow>
                <h3 className="font-display mt-3 text-2xl text-ink">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-(--container-page) border-t rule px-6 py-10 text-xs text-text-muted md:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span>
            © {new Date().getFullYear()} Stockletter. Educational use only.
          </span>
          <span className="tabular">
            Prices via Twelve Data · Portfolio via Supabase · Built with Next.js
          </span>
        </div>
      </footer>
    </main>
  );
}
