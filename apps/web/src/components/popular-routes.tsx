'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Train, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import type { Locale } from '@wayra/types';
import { popularRoutes } from '@/data/sample-suggestions';
import { formatDuration } from '@wayra/shared';

/**
 * Editorial-style popular-routes section.  Each card looks like a small
 * train ticket with origin / arrow / destination on the top line and a
 * departure-board mono duration on the bottom.
 */
export function PopularRoutes() {
  const t = useTranslations('home.sections');
  const locale = useLocale() as Locale;

  return (
    <section aria-labelledby="popular-routes-title">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <span className="chip-brand">
            <TrendingUp className="h-3 w-3" />
            Trending
          </span>
          <h2
            id="popular-routes-title"
            className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold"
          >
            {t('popularRoutes')}
          </h2>
        </div>
        <Link
          href="/search"
          className="link-editorial text-muted hidden text-sm font-semibold hover:text-[rgb(var(--text))] sm:inline-flex"
        >
          See all →
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {popularRoutes.map((r, i) => (
          <Link
            key={r.id}
            href={`/plan?from=${encodeURIComponent(r.from.id)}&to=${encodeURIComponent(r.to.id)}`}
            className="ticket ticket--stub focus-ring group relative isolate flex items-stretch overflow-hidden"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Left stub — vehicle icon + country flag */}
            <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 bg-[rgb(var(--surface-muted))] py-5 text-center">
              <Train className="text-brand-600 dark:text-brand-400 h-5 w-5" />
              <span className="text-subtle font-mono text-[10px] font-bold uppercase tracking-[0.15em]">
                {r.countryCode}
              </span>
            </div>

            {/* Body */}
            <div className="relative flex-1 p-4">
              <div className="text-subtle flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                <span className="inline-flex items-center gap-1.5">
                  {r.modes.slice(0, 2).join(' · ')}
                </span>
                <span className="text-muted inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="board-num">{formatDuration(r.durationMin * 60, locale)}</span>
                </span>
              </div>

              <div className="font-display mt-3 flex items-center gap-2 text-base font-bold">
                <span className="truncate" title={r.from.name}>
                  {r.from.name}
                </span>
                <ArrowRight className="text-brand-500 h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                <span className="text-accent-700 dark:text-accent-400 truncate" title={r.to.name}>
                  {r.to.name}
                </span>
              </div>

              {/* Mini route line decoration */}
              <svg
                viewBox="0 0 200 16"
                aria-hidden
                className="mt-3 h-3 w-full opacity-70"
                preserveAspectRatio="none"
              >
                <circle cx="3" cy="8" r="3" className="fill-brand-500" />
                <line
                  x1="6"
                  y1="8"
                  x2="194"
                  y2="8"
                  className="stroke-dash stroke-[rgb(var(--border-strong))]"
                  strokeWidth="1.5"
                />
                <circle cx="197" cy="8" r="3" className="fill-accent-500" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
