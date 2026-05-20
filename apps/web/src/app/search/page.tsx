import * as React from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SearchClient } from './search-client';

export const metadata = { title: 'Search' };

export default function SearchPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative">
        {/* Hero header */}
        <section className="relative isolate overflow-hidden border-b border-[rgb(var(--border))]">
          <div className="hero-aurora opacity-60" />
          <div className="grid-pattern absolute inset-0 -z-10 opacity-40 dark:opacity-20" />
          <div className="mx-auto max-w-5xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
            <span className="chip-brand">
              <SearchIcon className="h-3 w-3" />
              Explore
            </span>
            <h1 className="font-display text-display-md tracking-tightest display-tight mt-4 font-bold">
              Find any{' '}
              <span className="from-brand-600 to-accent-600 bg-gradient-to-r bg-clip-text text-transparent">
                station, stop or city
              </span>
            </h1>
            <p className="text-muted mt-3 max-w-2xl text-pretty text-base leading-relaxed">
              Type a name in any language. Try{' '}
              <span className="font-mono text-[12px] text-[rgb(var(--text))]">Frankfurt Hbf</span>,{' '}
              <span className="font-mono text-[12px] text-[rgb(var(--text))]">Tunis Marine</span> or{' '}
              <span className="font-mono text-[12px] text-[rgb(var(--text))]">المرسى</span>.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
          <React.Suspense fallback={<div className="skeleton h-14 rounded-2xl" />}>
            <SearchClient />
          </React.Suspense>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
