'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Home, Briefcase, Train, MapPin, Ticket, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionItem {
  href: string;
  label: string;
  sub: string;
  Icon: typeof Home;
  /** Tailwind gradient classes for the accent halo */
  accent: string;
  /** Tone for the icon container */
  tone: 'brand' | 'amber' | 'gold' | 'violet' | 'coral';
}

const TONE_CLASSES: Record<ActionItem['tone'], string> = {
  brand: 'from-brand-500 to-brand-700 text-white',
  amber: 'from-accent-400 to-accent-600 text-white',
  gold: 'from-amber-300 to-accent-500 text-ink-900',
  violet: 'from-violet-500 to-fuchsia-600 text-white',
  coral: 'from-rose-400 to-rose-600 text-white',
};

export function QuickActions() {
  const t = useTranslations('home.quickActions');
  const items: ActionItem[] = [
    {
      href: '/plan?favorite=home',
      label: t('home'),
      sub: 'Get me home',
      Icon: Home,
      accent: 'from-brand-500/30 via-brand-500/0 to-brand-500/0',
      tone: 'brand',
    },
    {
      href: '/plan?favorite=work',
      label: t('work'),
      sub: 'Daily commute',
      Icon: Briefcase,
      accent: 'from-accent-500/30 via-accent-500/0 to-accent-500/0',
      tone: 'amber',
    },
    {
      href: '/search?type=station',
      label: t('findStation'),
      sub: 'Search stations',
      Icon: Train,
      accent: 'from-brand-400/30 via-brand-400/0 to-brand-400/0',
      tone: 'brand',
    },
    {
      href: '/search?type=stop',
      label: t('findStop'),
      sub: 'Nearby stops',
      Icon: MapPin,
      accent: 'from-violet-500/25 via-violet-500/0 to-violet-500/0',
      tone: 'violet',
    },
    {
      href: '/fares',
      label: t('compareFares'),
      sub: 'Compare prices',
      Icon: Ticket,
      accent: 'from-amber-400/30 via-amber-400/0 to-amber-400/0',
      tone: 'gold',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ href, label, sub, Icon, accent, tone }) => (
        <Link
          key={href}
          href={href}
          className="surface-elevated group relative isolate overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card focus-ring"
        >
          {/* Background halo */}
          <div
            className={cn(
              'pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100',
              accent,
            )}
          />
          {/* Icon tile */}
          <div
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3',
              TONE_CLASSES[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="mt-3 flex items-start justify-between gap-2">
            <div>
              <div className="font-display text-sm font-bold tracking-tight">{label}</div>
              <div className="mt-0.5 text-[11px] text-subtle">{sub}</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-subtle transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[rgb(var(--text))]" />
          </div>
        </Link>
      ))}
    </div>
  );
}
