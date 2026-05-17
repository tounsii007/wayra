import * as React from 'react';
import { SiteHeader } from '@/components/site-header';
import { SearchClient } from './search-client';

export const metadata = { title: 'Search' };

export default function SearchPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <React.Suspense fallback={<div className="skeleton h-12 rounded-2xl" />}>
          <SearchClient />
        </React.Suspense>
      </main>
    </>
  );
}
