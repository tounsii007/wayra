import { SiteHeader } from '@/components/site-header';

export const metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 prose-invert">
        <h1 className="text-3xl font-bold">Privacy</h1>
        <p className="mt-3 text-sm text-muted">Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted">
          <h2 className="text-base font-semibold text-[rgb(var(--text))]">Data we store</h2>
          <p>
            Wayra is designed to work without a user account. When you do create one, we store:
            email, display name, preferred locale and theme, a bcrypt hash of your password, and
            (if you opt in) push subscription endpoints + your notification channel preferences.
          </p>
          <p>
            Search history, recent places and offline-region state stay on your device unless you
            explicitly save a route or favorite to your account.
          </p>

          <h2 className="text-base font-semibold text-[rgb(var(--text))]">Data we don't</h2>
          <p>
            We do not sell data, do not run third-party advertising trackers, and do not share
            your location with anyone. Map tiles are fetched directly from OpenStreetMap or
            MapTiler — Wayra never proxies your location through its own logs.
          </p>

          <h2 className="text-base font-semibold text-[rgb(var(--text))]">Your controls</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Export: <code>GET /api/me/export</code> returns all your records as JSON (planned).</li>
            <li>Delete: <code>DELETE /api/auth/me</code> wipes your account and cascades to all related rows.</li>
            <li>Unsubscribe: <code>DELETE /api/me/notifications/subscriptions</code>.</li>
          </ul>

          <h2 className="text-base font-semibold text-[rgb(var(--text))]">Contact</h2>
          <p>For DSGVO requests, email <a className="text-brand-500" href="mailto:privacy@wayra.app">privacy@wayra.app</a>.</p>
        </section>
      </main>
    </>
  );
}
