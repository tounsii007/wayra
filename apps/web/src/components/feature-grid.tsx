'use client';

import { useTranslations } from 'next-intl';
import { Route as RouteIcon, Radio, DownloadCloud, MessageSquareText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const icons: LucideIcon[] = [RouteIcon, Radio, DownloadCloud, MessageSquareText];

export function FeatureGrid() {
  const t = useTranslations('home.features');
  const items = t.raw('items') as Array<{ title: string; body: string }>;

  return (
    <section aria-labelledby="features-title">
      <h2 id="features-title" className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">
        {t('title')}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, i) => {
          const Icon = icons[i] ?? RouteIcon;
          return (
            <article
              key={item.title}
              className="surface hover:shadow-card group relative overflow-hidden rounded-2xl p-6 transition-shadow"
            >
              <div className="from-brand-500/0 via-brand-500/60 to-brand-500/0 absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="bg-brand-50 dark:bg-brand-500/15 inline-flex h-11 w-11 items-center justify-center rounded-xl">
                <Icon className="text-brand-600 dark:text-brand-300 h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
              <p className="text-muted mt-1.5 text-sm leading-relaxed">{item.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
