import { SiteHeader } from '@/components/site-header';
import { MapView } from './map-view';

export const metadata = { title: 'Map' };

export default function MapPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="h-[calc(100vh-56px)] px-3 py-3 sm:h-[calc(100vh-64px)] sm:px-5">
        <MapView />
      </main>
    </>
  );
}
