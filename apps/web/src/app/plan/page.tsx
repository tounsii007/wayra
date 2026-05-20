import * as React from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PlanClient } from './plan-client';

export const metadata = { title: 'Plan trip' };

export default function PlanPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <React.Suspense fallback={<PlanSkeleton />}>
            <PlanClient />
          </React.Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function PlanSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="skeleton h-72 rounded-3xl" />
      <div className="space-y-3">
        <div className="skeleton h-40 rounded-3xl" />
        <div className="skeleton h-40 rounded-3xl" />
        <div className="skeleton h-40 rounded-3xl" />
      </div>
    </div>
  );
}
