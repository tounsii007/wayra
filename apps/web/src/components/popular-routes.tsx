'use client';

import { useTranslations } from 'next-intl';
import { Train, ArrowRight, Clock } from 'lucide-react';
import { popularRoutes } from '@/data/sample-suggestions';
import { formatDuration } from '@wayra/shared';
import { useLocale } from 'next-intl';
import type { Locale } from '@wayra/types';

export function PopularRoutes() {
  const t = useTranslations('home.sections');
  const locale = useLocale() as Locale;

  return (
    <section aria-labelledby="popular-routes-title">
      <div className="mb-4 flex items-end justify-between">
        <h2 id="popular-routes-title" className="text-lg font-semibold">
          {t('popularRoutes')}
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {popularRoutes.map((r) => (
          <article
            key={r.id}
            className="group relative overflow-hidden rounded-2xl surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
            <div className="flex items-center justify-between text-xs font-medium text-muted">
              <span className="inline-flex items-center gap-1">
                <Train className="h-3.5 w-3.5" />
                {r.modes.join(' · ')}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(r.durationMin * 60, locale)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-base font-semibold">
              <span className="truncate">{r.from.name}</span>
              <ArrowRight className="h-4 w-4 text-brand-500 shrink-0" />
              <span className="truncate">{r.to.name}</span>
            </div>
            <div className="mt-3 text-xs text-subtle">{r.countryCode}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
