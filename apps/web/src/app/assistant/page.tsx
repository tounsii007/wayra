import { SiteHeader } from '@/components/site-header';
import { AssistantClient } from './assistant-client';

export const metadata = { title: 'Travel assistant' };

export default function AssistantPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <AssistantClient />
      </main>
    </>
  );
}
