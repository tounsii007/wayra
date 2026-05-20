import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { HeroSearch } from '@/components/hero-search';
import { QuickActions } from '@/components/quick-actions';
import { PopularRoutes } from '@/components/popular-routes';
import { LiveStatusBanner } from '@/components/live-status-banner';
import { CountryPicker } from '@/components/country-picker';
import { FeatureGrid } from '@/components/feature-grid';
import { MapPreview } from '@/components/map-preview';

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="relative" id="main">
        {/* ---- HERO ---------------------------------------------------- */}
        <section className="relative isolate overflow-hidden">
          {/* Aurora gradient backdrop */}
          <div className="hero-aurora" />
          {/* Faint topographic / grid texture */}
          <div className="grid-pattern absolute inset-0 -z-10 opacity-50 dark:opacity-25" />

          <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:pb-24 lg:pt-24">
            <HeroIntro />

            <div className="mt-10 animate-fade-in-up">
              <HeroSearch />
            </div>

            <div className="mt-6 animate-fade-in-up [animation-delay:120ms]">
              <QuickActions />
            </div>

            {/* Decorative inline stats */}
            <HeroStats />
          </div>
        </section>

        {/* ---- MAP PREVIEW -------------------------------------------- */}
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:pb-16">
          <MapPreview />
        </section>

        {/* ---- LIVE + POPULAR + COUNTRIES ----------------------------- */}
        <section className="mx-auto max-w-7xl space-y-16 px-4 pb-16 sm:px-6 lg:pb-24">
          <LiveStatusBanner />
          <PopularRoutes />
          <CountryPicker />
        </section>

        {/* ---- FEATURES ----------------------------------------------- */}
        <section className="relative isolate overflow-hidden border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]/40">
          <div className="topo-pattern absolute inset-0 -z-10 opacity-40" />
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <FeatureGrid />
          </div>
        </section>

        {/* ---- BOTTOM CTA --------------------------------------------- */}
        <BottomCta />
      </main>

      <SiteFooter />
    </>
  );
}

/* ----------------------------------------------------------------------- */

function HeroIntro() {
  const t = useTranslations('home.hero');
  const tb = useTranslations('brand');
  return (
    <div className="max-w-4xl">
      <span className="chip-amber animate-fade-in-down">
        <span className="live-pip text-status-onTime" />
        <span className="ml-1">{tb('tagline')}</span>
      </span>

      <h1 className="mt-6 font-display text-display-xl font-bold display-tight">
        <span className="bg-gradient-to-br from-[rgb(var(--text))] via-brand-700 to-accent-700 bg-clip-text text-transparent dark:from-[rgb(var(--text))] dark:via-brand-300 dark:to-accent-400">
          {t('title')}
        </span>
      </h1>

      <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted sm:text-xl">
        {t('subtitle')}
      </p>
    </div>
  );
}

function HeroStats() {
  const stats = [
    { label: 'Countries', value: '11', unit: '+', tone: 'brand' as const },
    { label: 'Cities', value: '420', unit: '+', tone: 'amber' as const },
    { label: 'Real-time feeds', value: '34', unit: '', tone: 'brand' as const },
    { label: 'Stops indexed', value: '180k', unit: '+', tone: 'amber' as const },
  ];
  return (
    <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="animate-fade-in-up"
          style={{ animationDelay: `${200 + i * 60}ms` }}
        >
          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle">
            {s.label}
          </dt>
          <dd className="mt-1 flex items-baseline gap-0.5 font-display text-3xl font-bold tracking-tightest">
            <span className="board-num">{s.value}</span>
            <span
              className={
                s.tone === 'brand'
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-accent-600 dark:text-accent-400'
              }
            >
              {s.unit}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function BottomCta() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="hero-aurora opacity-60" />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="surface-elevated relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-10 text-center shadow-card">
          <Sparkles className="mx-auto h-7 w-7 text-accent-500" />
          <h2 className="mt-4 font-display text-display-md font-bold display-tight">
            Plan smarter. <span className="text-brand-600 dark:text-brand-400">Travel calmer.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted">
            One app. Trains, buses, metros and trams from Berlin to Tunis — with real-time
            updates, offline tickets and an AI assistant that actually knows the timetable.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href="/plan" className="btn-primary">
              Start planning
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/about" className="btn-surface">
              Learn more
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
