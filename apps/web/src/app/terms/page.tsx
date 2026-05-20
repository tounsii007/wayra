import { FileText } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { EditorialPage } from '@/components/editorial-page';

export const metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <EditorialPage
        chip="Terms"
        ChipIcon={FileText}
        title="Terms of"
        highlight="service."
        lead="Wayra is provided as-is for personal travel planning. Schedule and disruption data come from third parties and we aggregate but do not certify accuracy."
      >
        <h2>Data attributions</h2>
        <ul>
          <li>OpenStreetMap contributors (ODbL)</li>
          <li>Deutsche Bahn Open Data</li>
          <li>SNCF API · IDFM open data</li>
          <li>SNCFT (estimated) · TRANSTU (curated)</li>
          <li>MapLibre GL JS (BSD 3-Clause)</li>
        </ul>

        <h2>Liability</h2>
        <p>
          Use Wayra to plan, not to certify legal travel obligations. Always reconfirm critical
          connections with the official carrier — particularly during strikes or major disruptions.
        </p>

        <h2>Acceptable use</h2>
        <p>
          No automated scraping that degrades service for other users. No reverse-engineering of
          third-party data feeds whose own terms we are bound by. Public source code is MIT
          licensed; data is licensed by its respective owner.
        </p>
      </EditorialPage>
      <SiteFooter />
    </>
  );
}
