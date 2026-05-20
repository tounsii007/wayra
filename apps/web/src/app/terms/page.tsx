import { SiteHeader } from '@/components/site-header';

export const metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <section className="text-muted mt-6 space-y-4 text-sm leading-relaxed">
          <p>
            Wayra is provided as-is for personal travel planning. Schedule and disruption data
            originate from third parties (OpenStreetMap, GTFS / GTFS-RT feeds of the carriers named
            below). We aggregate but do not certify accuracy.
          </p>
          <h2 className="mt-6 text-base font-semibold text-[rgb(var(--text))]">
            Data attributions
          </h2>
          <ul className="list-disc pl-5">
            <li>OpenStreetMap contributors (ODbL)</li>
            <li>Deutsche Bahn Open Data</li>
            <li>SNCF API, IDFM open data</li>
            <li>SNCFT (estimated), TRANSTU (curated)</li>
            <li>MapLibre GL JS (BSD 3-Clause)</li>
          </ul>
          <h2 className="mt-6 text-base font-semibold text-[rgb(var(--text))]">Liability</h2>
          <p>
            Use Wayra to plan, not to certify legal travel obligations. Always reconfirm critical
            connections with the official carrier — particularly during strikes or major
            disruptions.
          </p>
        </section>
      </main>
    </>
  );
}
