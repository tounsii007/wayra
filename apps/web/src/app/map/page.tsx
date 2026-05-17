import { SiteHeader } from '@/components/site-header';
import { MapView } from './map-view';

export const metadata = { title: 'Map' };

export default function MapPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto h-[calc(100vh-64px)] max-w-7xl px-4 py-4 sm:px-6">
        <MapView />
      </main>
    </>
  );
}
