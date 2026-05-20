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
            <div className="animate-fade-in mt-8">
              <HeroSearch />
            </div>
            <div className="animate-fade-in mt-6">
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
      <span className="surface text-muted inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
        <span className="animate-pulse-soft bg-status-onTime inline-block h-2 w-2 rounded-full" />
        {tb('tagline')}
      </span>
      <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        {t('title')}
      </h1>
      <p className="text-muted mt-4 max-w-2xl text-lg">{t('subtitle')}</p>
    </div>
  );
}

function SiteFooter() {
  const t = useTranslations('brand');
  return (
    <footer className="border-t border-[rgb(var(--border))]">
      <div className="text-subtle mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6">
        <p>
          © {new Date().getFullYear()} {t('name')} · v0.5
        </p>
        <nav className="flex items-center gap-4">
          <a className="hover:text-[rgb(var(--text))]" href="/about">
            About
          </a>
          <a className="hover:text-[rgb(var(--text))]" href="/privacy">
            Privacy
          </a>
          <a className="hover:text-[rgb(var(--text))]" href="/terms">
            Terms
          </a>
          <a
            className="hover:text-[rgb(var(--text))]"
            href="https://github.com/tounsii007/wayra"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
