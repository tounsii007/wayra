import { SiteHeader } from '@/components/site-header';
import { LiveStatusBanner } from '@/components/live-status-banner';

export const metadata = { title: 'Live' };

export default function LivePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">Live status</h1>
        <p className="text-muted mt-1 text-sm">
          Real-time disruptions and platform changes across our networks.
        </p>
        <div className="mt-6">
          <LiveStatusBanner />
        </div>
      </main>
    </>
  );
}
