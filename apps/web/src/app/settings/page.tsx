import { Settings2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SettingsClient } from './settings-client';

export const metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative">
        <section className="relative isolate overflow-hidden border-b border-[rgb(var(--border))]">
          <div className="hero-aurora opacity-50" />
          <div className="grid-pattern absolute inset-0 -z-10 opacity-30 dark:opacity-15" />
          <div className="mx-auto max-w-4xl px-4 pb-6 pt-10 sm:px-6 sm:pt-14">
            <span className="chip-brand">
              <Settings2 className="h-3 w-3" />
              Account
            </span>
            <h1 className="font-display text-display-md tracking-tightest display-tight mt-4 font-bold">
              Settings
            </h1>
            <p className="text-muted mt-2 max-w-xl text-pretty text-base">
              Tune appearance, notifications and data — all changes save automatically.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
          <SettingsClient />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
