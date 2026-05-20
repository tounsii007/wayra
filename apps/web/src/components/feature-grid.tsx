'use client';

import { useTranslations } from 'next-intl';
import {
  Route as RouteIcon,
  Radio,
  DownloadCloud,
  MessageSquareText,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons: LucideIcon[] = [RouteIcon, Radio, DownloadCloud, MessageSquareText];

const tones = [
  'from-brand-500/15 to-brand-500/0 border-brand-500/30 text-brand-700 dark:text-brand-300',
  'from-accent-500/15 to-accent-500/0 border-accent-500/30 text-accent-700 dark:text-accent-400',
  'from-violet-500/15 to-violet-500/0 border-violet-500/30 text-violet-700 dark:text-violet-300',
  'from-emerald-500/15 to-emerald-500/0 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
];

/**
 * Editorial feature grid — asymmetric, with a chip-style intro and
 * accent-tinted cards that lift on hover.
 */
export function FeatureGrid() {
  const t = useTranslations('home.features');
  const items = t.raw('items') as Array<{ title: string; body: string }>;

  return (
    <section aria-labelledby="features-title">
      <header className="mb-10 max-w-2xl">
        <span className="chip-amber">
          <Sparkles className="h-3 w-3" />
          What makes Wayra different
        </span>
        <h2
          id="features-title"
          className="mt-4 font-display text-display-md font-bold tracking-tightest display-tight"
        >
          {t('title')}
        </h2>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, i) => {
          const Icon = icons[i] ?? RouteIcon;
          const tone = tones[i % tones.length]!;
          const toneParts = tone.split(' ');
          return (
            <article
              key={item.title}
              className={cn(
                'surface-elevated group relative isolate overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card',
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Accent halo */}
              <div
                className={cn(
                  'pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                  toneParts[3], // text color
                )}
              />
              <div
                className={cn(
                  'pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100',
                  toneParts[0], // from-*/15
                  toneParts[1], // to-*/0
                )}
              />

              {/* Icon block */}
              <div
                className={cn(
                  'inline-flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-sm transition-transform duration-300 group-hover:scale-105',
                  tone,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Index marker — top-right corner */}
              <span className="absolute right-4 top-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-subtle">
                0{i + 1}
              </span>

              <h3 className="mt-5 font-display text-lg font-bold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>

              {/* Bottom divider with mini route line */}
              <div className="mt-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                <span className="h-px flex-1 bg-[linear-gradient(to_right,rgb(var(--border)) 50%,transparent 50%)] bg-[length:6px_1px]" />
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-30" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
