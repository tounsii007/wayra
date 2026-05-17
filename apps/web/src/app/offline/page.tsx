import { SiteHeader } from '@/components/site-header';
import { OfflineClient } from './offline-client';

export const metadata = { title: 'Offline regions' };

export default function OfflinePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Offline regions</h1>
          <p className="mt-1 text-sm text-muted">
            Download cities to navigate even without internet. Useful for Tunis, Paris metro
            and German cities with patchy underground coverage.
          </p>
        </header>
        <OfflineClient />
      </main>
    </>
  );
}
