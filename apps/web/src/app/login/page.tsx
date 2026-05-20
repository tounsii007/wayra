import { ArrowRight, MapPin, Sparkles, Train } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { WayraLogo } from '@/components/wayra-logo';
import { AuthForm } from './auth-form';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative isolate min-h-[calc(100vh-64px)] overflow-hidden">
        {/* Background aurora */}
        <div className="hero-aurora opacity-80" />
        <div className="grid-pattern absolute inset-0 -z-10 opacity-40 dark:opacity-20" />

        <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-16">
          {/* Left — editorial brand block */}
          <section className="hidden lg:block">
            <WayraLogo className="h-12 w-12" />
            <h1 className="font-display text-display-lg tracking-tightest display-tight mt-6 font-bold">
              Your transit{' '}
              <span className="from-brand-600 to-accent-600 bg-gradient-to-r bg-clip-text text-transparent">
                companion
              </span>
              <br />
              across two continents.
            </h1>
            <p className="text-muted mt-6 max-w-md text-pretty text-lg leading-relaxed">
              Sign in to save favourite stops, get notified when your train is delayed, and sync
              your trips across phone and web.
            </p>

            {/* Feature list */}
            <ul className="mt-8 grid max-w-md gap-4">
              {[
                {
                  Icon: Train,
                  title: 'Saved trips & favourites',
                  body: 'Sync between phone and web. Get push when your trip is disrupted.',
                },
                {
                  Icon: MapPin,
                  title: 'Offline regions',
                  body: 'Download cities for trips through tunnels and dead zones.',
                },
                {
                  Icon: Sparkles,
                  title: 'AI assistant',
                  body: 'Ask in natural language — "fastest way to Paris tomorrow morning".',
                },
              ].map(({ Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="from-brand-500 to-brand-700 mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold tracking-tight">{title}</h3>
                    <p className="text-muted mt-0.5 text-sm">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-subtle mt-10 max-w-md font-mono text-[10px] uppercase tracking-[0.2em]">
              <ArrowRight className="mr-1 inline h-3 w-3" />
              Privacy-first · open source · GDPR compliant
            </p>
          </section>

          {/* Right — auth ticket */}
          <section className="mx-auto w-full max-w-md">
            <AuthForm />
          </section>
        </div>
      </main>
    </>
  );
}
