import { ShieldCheck } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { EditorialPage } from '@/components/editorial-page';

export const metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <SiteHeader />
      <EditorialPage
        chip="Privacy"
        ChipIcon={ShieldCheck}
        title="Privacy"
        highlight="by design."
        lead="Wayra works without an account, no third-party trackers, no ad networks. Here's exactly what we store when you do sign in."
        meta={`Last updated · ${today}`}
      >
        <h2>Data we store</h2>
        <p>
          When you create an account we store: email, display name, preferred locale and theme, a
          bcrypt hash of your password, and (if you opt in) push subscription endpoints + your
          notification channel preferences.
        </p>
        <p>
          Search history, recent places and offline-region state stay on your device unless you
          explicitly save a route or favourite to your account.
        </p>

        <h2>Data we don&apos;t</h2>
        <p>
          We do not sell data, do not run third-party advertising trackers, and do not share your
          location with anyone. Map tiles are fetched directly from OpenStreetMap or MapTiler —
          Wayra never proxies your location through its own logs.
        </p>

        <h2>Your controls</h2>
        <ul>
          <li>
            Export: <code>GET /api/me/export</code> returns all your records as JSON.
          </li>
          <li>
            Delete: <code>DELETE /api/auth/me</code> wipes your account and cascades to all related
            rows.
          </li>
          <li>
            Unsubscribe: <code>DELETE /api/me/notifications/subscriptions</code>.
          </li>
        </ul>

        <h2>Contact</h2>
        <p>
          For GDPR / DSGVO requests, email <a href="mailto:privacy@wayra.app">privacy@wayra.app</a>.
        </p>
      </EditorialPage>
      <SiteFooter />
    </>
  );
}
