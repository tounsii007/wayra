import { SiteHeader } from '@/components/site-header';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold">About Wayra</h1>
        <section className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
          <p>
            Wayra is an open, multilingual transit & travel-planning platform for Europe and
            North Africa. We bring trains, metros, trams and buses into a single, calm UI — with
            real-time delays, offline timetables, and a Claude-powered assistant that explains
            what's happening.
          </p>
          <p>
            We ship as a monorepo (Next.js + Expo + NestJS, PostgreSQL with PostGIS, Redis,
            MapLibre) and aim to keep dependencies open-source where possible.
          </p>
          <h2 className="mt-6 text-base font-semibold text-[rgb(var(--text))]">Open data, open code</h2>
          <p>
            Schedule data comes from public GTFS feeds and OpenStreetMap. Wayra's own code is
            MIT-licensed; see <a className="text-brand-500" href="https://github.com/tounsii007/wayra">the repository</a>.
          </p>
        </section>
      </main>
    </>
  );
}
