import { Suspense } from 'react';
import { SiteHeader } from '@/components/site-header';
import { PlanClient } from './plan-client';

export const metadata = { title: 'Plan trip' };

export default function PlanPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Suspense fallback={<PlanSkeleton />}>
          <PlanClient />
        </Suspense>
      </main>
    </>
  );
}

function PlanSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-40 w-full" />
    </div>
  );
}
