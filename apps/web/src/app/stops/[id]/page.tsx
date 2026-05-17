import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { StopDetailsClient } from './stop-details-client';
import { sampleSuggestions } from '@/data/sample-suggestions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const place = sampleSuggestions.find((p) => p.id === decodeURIComponent(id));
  return { title: place?.name ?? 'Stop' };
}

export default async function StopPage({ params }: PageProps) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const place = sampleSuggestions.find((p) => p.id === decoded);
  if (!place) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <StopDetailsClient place={place} />
      </main>
    </>
  );
}
