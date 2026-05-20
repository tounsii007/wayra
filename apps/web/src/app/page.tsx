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

            <div className="animate-fade-in-up mt-10">
              <HeroSearch />
            </div>

            <div className="animate-fade-in-up mt-6 [animation-delay:120ms]">
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

      <h1 className="font-display text-display-xl display-tight mt-6 font-bold">
        <span className="via-brand-700 to-accent-700 dark:via-brand-300 dark:to-accent-400 bg-gradient-to-br from-[rgb(var(--text))] bg-clip-text text-transparent dark:from-[rgb(var(--text))]">
          {t('title')}
        </span>
      </h1>

      <p className="text-muted mt-5 max-w-2xl text-pretty text-lg leading-relaxed sm:text-xl">
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
          <dt className="text-subtle text-[11px] font-semibold uppercase tracking-[0.18em]">
            {s.label}
          </dt>
          <dd className="font-display tracking-tightest mt-1 flex items-baseline gap-0.5 text-3xl font-bold">
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
        <div className="surface-elevated shadow-card relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-10 text-center">
          <Sparkles className="text-accent-500 mx-auto h-7 w-7" />
          <h2 className="font-display text-display-md display-tight mt-4 font-bold">
            Plan smarter. <span className="text-brand-600 dark:text-brand-400">Travel calmer.</span>
          </h2>
          <p className="text-muted mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed">
            One app. Trains, buses, metros and trams from Berlin to Tunis — with real-time updates,
            offline tickets and an AI assistant that actually knows the timetable.
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
