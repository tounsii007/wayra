import { Info } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { EditorialPage } from '@/components/editorial-page';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <EditorialPage
        chip="About"
        ChipIcon={Info}
        title="One transit app for"
        highlight="two continents."
        lead="Wayra brings trains, metros, trams and buses across Europe and North Africa into a single, calm UI — with real-time delays, offline timetables, and a Claude-powered assistant that explains what's actually happening."
      >
        <h2>What it is</h2>
        <p>
          Wayra is an open multilingual transit & travel-planning platform. The web app, mobile app
          and backend live in a single TypeScript monorepo and share types, design tokens and
          translation strings — so a place named in Arabic on the phone is the same record the
          backend returns to the browser.
        </p>

        <h2>How it's built</h2>
        <p>
          Next.js 15 + Expo SDK 52 + NestJS 10, with PostgreSQL + PostGIS for geo, Redis for caching
          + Socket.IO scaling, OpenTripPlanner for the routing graph, and MapLibre for maps. We host
          a thin layer over public GTFS / GTFS-RT feeds and OpenStreetMap.
        </p>

        <h2>Open data, open code</h2>
        <p>
          Schedule data comes from public GTFS feeds and OpenStreetMap. Wayra&apos;s own code is
          MIT-licensed — see{' '}
          <a href="https://github.com/tounsii007/wayra" target="_blank" rel="noreferrer">
            the repository
          </a>
          .
        </p>

        <h2>Privacy-first</h2>
        <p>
          Wayra is designed to work without an account. No third-party trackers, no ad networks, no
          location pings. When you sign in we store the minimum needed to sync your favourites and
          notification preferences — and you can <a href="/privacy">read every detail</a> in the
          privacy policy.
        </p>

        <h2>Coverage today</h2>
        <p>
          We currently index 11 countries: Germany, France, Tunisia, Austria, Switzerland, Belgium,
          Netherlands, Italy, Spain, Morocco and Algeria. New networks are added when we can
          integrate them with confidence — accurate names + reliable real-time feeds first,
          marketing second.
        </p>
      </EditorialPage>
      <SiteFooter />
    </>
  );
}
