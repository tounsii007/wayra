import { Compass } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { AssistantClient } from './assistant-client';

export const metadata = { title: 'Travel assistant' };

export default function AssistantPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative">
        <section className="relative isolate overflow-hidden border-b border-[rgb(var(--border))]">
          <div className="hero-aurora opacity-50" />
          <div className="grid-pattern absolute inset-0 -z-10 opacity-30 dark:opacity-15" />
          <div className="mx-auto max-w-4xl px-4 pb-4 pt-10 sm:px-6 sm:pt-14">
            <span className="chip-amber">
              <Compass className="h-3 w-3" />
              AI
            </span>
            <h1 className="font-display text-display-md tracking-tightest display-tight mt-4 font-bold">
              Travel{' '}
              <span className="from-brand-600 to-accent-600 bg-gradient-to-r bg-clip-text text-transparent">
                assistant
              </span>
            </h1>
            <p className="text-muted mt-2 max-w-xl text-pretty text-base">
              Ask in any language — routes, delays, fares, alternatives. Backed by Claude + live
              GTFS data.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-8">
          <AssistantClient />
        </section>
      </main>
    </>
  );
}
