'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Home, Briefcase, Train, MapPin, Ticket } from 'lucide-react';

export function QuickActions() {
  const t = useTranslations('home.quickActions');
  const items = [
    {
      href: '/plan?favorite=home',
      label: t('home'),
      Icon: Home,
      accent: 'from-brand-500 to-accent-violet',
    },
    {
      href: '/plan?favorite=work',
      label: t('work'),
      Icon: Briefcase,
      accent: 'from-brand-500 to-brand-400',
    },
    {
      href: '/search?type=station',
      label: t('findStation'),
      Icon: Train,
      accent: 'from-accent-teal to-brand-500',
    },
    {
      href: '/search?type=stop',
      label: t('findStop'),
      Icon: MapPin,
      accent: 'from-accent-violet to-brand-500',
    },
    {
      href: '/fares',
      label: t('compareFares'),
      Icon: Ticket,
      accent: 'from-accent-sunset to-brand-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ href, label, Icon, accent }) => (
        <Link
          key={href}
          href={href}
          className="surface hover:shadow-card focus-ring group relative overflow-hidden rounded-2xl p-4 shadow-sm transition-shadow"
        >
          <div
            className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-xl transition-opacity group-hover:opacity-30`}
          />
          <div
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} shadow-glow text-white`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="mt-3 text-sm font-semibold">{label}</div>
        </Link>
      ))}
    </div>
  );
}
