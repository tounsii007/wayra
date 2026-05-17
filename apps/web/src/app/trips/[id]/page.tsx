import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { TripDetailsClient } from './trip-details-client';
import { mockRouteResults } from '@/data/mock-routes';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Trip ${decodeURIComponent(id)}` };
}

export default async function TripPage({ params }: PageProps) {
  const { id } = await params;
  const route = mockRouteResults.find((r) => r.id === decodeURIComponent(id));
  if (!route) notFound();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <TripDetailsClient route={route} />
      </main>
    </>
  );
}
