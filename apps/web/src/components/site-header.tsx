'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sparkles, Map as MapIcon, Activity, Settings2, UserCircle2 } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';
import { WayraLogo } from './wayra-logo';
import { useAuthStore } from '@/lib/auth-store';

export function SiteHeader() {
  const t = useTranslations('nav');
  const user = useAuthStore((s) => s.user);

  const links = [
    { href: '/plan', label: t('plan'), icon: Sparkles },
    { href: '/map', label: t('map'), icon: MapIcon },
    { href: '/live', label: t('live'), icon: Activity },
    { href: '/assistant', label: t('assistant'), icon: Sparkles },
    { href: '/settings', label: t('settings'), icon: Settings2 },
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-x-0 top-0 h-16 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/70 backdrop-blur-xl" />
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="focus-ring flex items-center gap-2 rounded-md">
          <WayraLogo className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight">Wayra</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted focus-ring rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-[rgb(var(--surface-muted))] hover:text-[rgb(var(--text))]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href={user ? '/me' : '/login'}
            aria-label={user ? 'Profile' : 'Sign in'}
            className="glass focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105"
          >
            {user ? (
              <span className="text-xs font-bold uppercase">
                {(user.displayName ?? user.email ?? '?').slice(0, 1)}
              </span>
            ) : (
              <UserCircle2 className="h-4 w-4" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
