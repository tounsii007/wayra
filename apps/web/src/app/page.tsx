import { useTranslations } from 'next-intl';
import { SiteHeader } from '@/components/site-header';
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
      <main className="relative">
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div className="hero-blob" />
          <div className="grid-pattern absolute inset-0 -z-10 opacity-60 dark:opacity-30" />
          <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pt-14 lg:pb-20 lg:pt-20">
            <HeroIntro />
            <div className="mt-8 animate-fade-in">
              <HeroSearch />
            </div>
            <div className="mt-6 animate-fade-in">
              <QuickActions />
            </div>
          </div>
        </section>

        {/* Map preview */}
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:pb-16">
          <MapPreview />
        </section>

        {/* Live + popular + countries */}
        <section className="mx-auto max-w-7xl space-y-12 px-4 pb-12 sm:px-6 lg:pb-20">
          <LiveStatusBanner />
          <PopularRoutes />
          <CountryPicker />
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <FeatureGrid />
        </section>

        <SiteFooter />
      </main>
    </>
  );
}

function HeroIntro() {
  const t = useTranslations('home.hero');
  const tb = useTranslations('brand');
  return (
    <div className="max-w-3xl">
      <span className="inline-flex items-center gap-2 rounded-full surface px-3 py-1 text-xs font-semibold text-muted shadow-sm">
        <span className="inline-block h-2 w-2 animate-pulse-soft rounded-full bg-status-onTime" />
        {tb('tagline')}
      </span>
      <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
        {t('title')}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{t('subtitle')}</p>
    </div>
  );
}

function SiteFooter() {
  const t = useTranslations('brand');
  return (
    <footer className="border-t border-[rgb(var(--border))]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-subtle sm:flex-row sm:px-6">
        <p>
          © {new Date().getFullYear()} {t('name')} · MVP build
        </p>
        <p className="inline-flex items-center gap-2">
          <span>Data: OSM, GTFS, GTFS-RT, DB, SNCF, SNCFT</span>
        </p>
      </div>
    </footer>
  );
}
