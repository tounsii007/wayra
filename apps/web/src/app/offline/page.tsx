import { CloudDownload } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { OfflineClient } from './offline-client';

export const metadata = { title: 'Offline regions' };

export default function OfflinePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative">
        <section className="relative isolate overflow-hidden border-b border-[rgb(var(--border))]">
          <div className="hero-aurora opacity-50" />
          <div className="grid-pattern absolute inset-0 -z-10 opacity-30 dark:opacity-15" />
          <div className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
            <span className="chip-brand">
              <CloudDownload className="h-3 w-3" />
              Storage
            </span>
            <h1 className="font-display text-display-md tracking-tightest display-tight mt-4 font-bold">
              Offline regions
            </h1>
            <p className="text-muted mt-3 max-w-2xl text-pretty text-base leading-relaxed">
              Download cities to navigate without internet — useful for the Paris métro tunnels,
              Berlin U-Bahn underground sections, and Tunis where connectivity can be patchy.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
          <OfflineClient />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
