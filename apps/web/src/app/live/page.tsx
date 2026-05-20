import { Activity, RadioTower, AlertTriangle, Zap } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { LiveStatusBanner } from '@/components/live-status-banner';

export const metadata = { title: 'Live status' };

const NETWORK_HEALTH = [
  { network: 'DB Bahn', country: 'DE', uptime: '99.4%', avgDelay: '4.2m', status: 'ok' },
  { network: 'SNCF', country: 'FR', uptime: '98.1%', avgDelay: '6.8m', status: 'minor' },
  { network: 'SNCFT', country: 'TN', uptime: '97.2%', avgDelay: '5.1m', status: 'minor' },
  { network: 'Trenitalia', country: 'IT', uptime: '99.0%', avgDelay: '3.6m', status: 'ok' },
  { network: 'ÖBB', country: 'AT', uptime: '99.8%', avgDelay: '2.1m', status: 'ok' },
  { network: 'SBB', country: 'CH', uptime: '99.9%', avgDelay: '1.4m', status: 'ok' },
];

const RECENT_DISRUPTIONS = [
  {
    line: 'RER B',
    country: 'FR',
    title: 'Trafic interrompu — Châtelet–Les Halles',
    note: 'Reprise estimée à 15h30. Bus de substitution disponibles.',
    severity: 'severe',
    time: '12:08',
  },
  {
    line: 'U2',
    country: 'DE',
    title: 'Verspätungen wegen Signalstörung',
    note: '~8 min Verspätung zwischen Alex und Pankow.',
    severity: 'minor',
    time: '12:32',
  },
  {
    line: 'Métro 1',
    country: 'TN',
    title: 'Service ralenti — Sortie de la Charguia',
    note: 'Service partiel, intervalles allongés.',
    severity: 'minor',
    time: '11:48',
  },
];

export default function LivePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative">
        {/* Hero header */}
        <section className="relative isolate overflow-hidden border-b border-[rgb(var(--border))]">
          <div className="hero-aurora opacity-60" />
          <div className="grid-pattern absolute inset-0 -z-10 opacity-40 dark:opacity-20" />
          <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
            <span className="chip-amber">
              <RadioTower className="h-3 w-3" />
              Realtime
            </span>
            <h1 className="font-display text-display-md tracking-tightest display-tight mt-4 font-bold">
              Live{' '}
              <span className="from-brand-600 to-accent-600 bg-gradient-to-r bg-clip-text text-transparent">
                network status
              </span>
            </h1>
            <p className="text-muted mt-3 max-w-2xl text-pretty text-base leading-relaxed">
              Real-time disruptions, platform changes, and operator health across our networks —
              streaming over GTFS-RT, SIRI and operator APIs.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:py-16">
          {/* Main live banner */}
          <LiveStatusBanner />

          {/* Network health */}
          <div>
            <header className="mb-5 flex items-end justify-between gap-3">
              <div>
                <span className="chip-brand">
                  <Activity className="h-3 w-3" />
                  Operators
                </span>
                <h2 className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold">
                  Network health
                </h2>
              </div>
              <span className="text-subtle font-mono text-[11px] uppercase tracking-[0.18em]">
                last 24h
              </span>
            </header>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {NETWORK_HEALTH.map((n) => (
                <article
                  key={n.network}
                  className="surface-elevated hover:shadow-card rounded-3xl p-5 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-base font-bold tracking-tight">
                        {n.network}
                      </h3>
                      <p className="text-subtle font-mono text-[10px] uppercase tracking-[0.18em]">
                        {n.country}
                      </p>
                    </div>
                    <span
                      className={
                        n.status === 'ok'
                          ? 'bg-status-onTime/15 text-status-onTime inline-flex h-7 items-center rounded-full px-2 text-[10px] font-bold uppercase tracking-[0.16em]'
                          : 'bg-status-delay/15 text-status-delay inline-flex h-7 items-center rounded-full px-2 text-[10px] font-bold uppercase tracking-[0.16em]'
                      }
                    >
                      {n.status === 'ok' ? 'Normal' : 'Minor'}
                    </span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-subtle font-mono text-[10px] uppercase tracking-[0.18em]">
                        Uptime
                      </dt>
                      <dd className="board-num font-display text-xl font-bold tracking-tight">
                        {n.uptime}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-subtle font-mono text-[10px] uppercase tracking-[0.18em]">
                        Avg delay
                      </dt>
                      <dd className="board-num font-display text-xl font-bold tracking-tight">
                        {n.avgDelay}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>

          {/* Recent disruptions */}
          <div>
            <header className="mb-5 flex items-end justify-between gap-3">
              <div>
                <span className="chip-amber">
                  <Zap className="h-3 w-3" />
                  Disruptions
                </span>
                <h2 className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold">
                  Recent alerts
                </h2>
              </div>
            </header>

            <ul className="grid gap-3">
              {RECENT_DISRUPTIONS.map((d, i) => (
                <li
                  key={i}
                  className="ticket flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5"
                >
                  <span
                    className={
                      d.severity === 'severe'
                        ? 'bg-status-severe/15 text-status-severe inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl'
                        : 'bg-status-delay/15 text-status-delay inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl'
                    }
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="bg-ink-900 inline-flex h-6 items-center rounded-full px-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-100">
                        {d.line}
                      </span>
                      <span className="text-subtle font-mono text-[10px] uppercase tracking-[0.16em]">
                        {d.country}
                      </span>
                      <span className="board-num text-muted ml-auto font-mono text-xs">
                        {d.time}
                      </span>
                    </div>
                    <h3 className="font-display mt-2 text-base font-bold tracking-tight">
                      {d.title}
                    </h3>
                    <p className="text-muted mt-1 text-sm">{d.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
