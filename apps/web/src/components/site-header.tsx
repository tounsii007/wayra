'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  Sparkles,
  Map as MapIcon,
  Activity,
  Settings2,
  UserCircle2,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';
import { WayraLogo } from './wayra-logo';
import { useAuthStore, type AuthUser } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  Icon: typeof Sparkles;
}

export function SiteHeader() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Track page-scroll so the header tightens after the hero passes by.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const links: NavLink[] = [
    { href: '/plan', label: t('plan'), Icon: Sparkles },
    { href: '/map', label: t('map'), Icon: MapIcon },
    { href: '/live', label: t('live'), Icon: Activity },
    { href: '/assistant', label: t('assistant'), Icon: Compass },
    { href: '/settings', label: t('settings'), Icon: Settings2 },
  ];

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300 ease-arrive',
          scrolled ? 'h-14' : 'h-16',
        )}
      >
        {/* Backdrop — soft cream/ink with progressive blur */}
        <div
          className={cn(
            'absolute inset-x-0 top-0 transition-all duration-300 ease-arrive',
            scrolled
              ? 'h-14 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/85 backdrop-blur-xl'
              : 'h-16 bg-[rgb(var(--bg))]/40 backdrop-blur-sm',
          )}
        />

        <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Brand */}
          <Link
            href="/"
            className="focus-ring group inline-flex items-center gap-2.5 rounded-xl"
            aria-label="Wayra — home"
          >
            <span className="relative inline-flex items-center justify-center">
              <WayraLogo className={cn('transition-transform duration-300', scrolled ? 'h-7 w-7' : 'h-8 w-8')} />
              <span className="absolute -inset-2 rounded-2xl bg-brand-500/0 transition-colors duration-300 group-hover:bg-brand-500/10" />
            </span>
            <span className="flex flex-col leading-none">
              <span
                className={cn(
                  'font-display font-bold tracking-tightest text-[rgb(var(--text))] transition-all duration-300',
                  scrolled ? 'text-base' : 'text-lg',
                )}
              >
                Wayra
              </span>
              {!scrolled && (
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-subtle">
                  transit · re-imagined
                </span>
              )}
            </span>
          </Link>

          {/* Desktop nav — magnetic underline */}
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
            {links.map(({ href, label, Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'group relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors focus-ring',
                    active
                      ? 'text-[rgb(var(--text))]'
                      : 'text-muted hover:text-[rgb(var(--text))]',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-300',
                      'group-hover:-translate-y-0.5',
                      active && 'text-brand-600 dark:text-brand-400',
                    )}
                  />
                  <span>{label}</span>
                  {active && (
                    <span className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-accent-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5">
            {/* Network-status pip — clickable shortcut to /live */}
            <Link
              href="/live"
              aria-label="Live network status"
              className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted transition-colors hover:text-[rgb(var(--text))] focus-ring sm:inline-flex"
            >
              <span className="live-pip text-status-onTime" />
              <span className="ml-1 hidden lg:inline">All systems</span>
            </Link>

            <LocaleSwitcher />
            <ThemeToggle />

            {/* Profile */}
            <Link
              href={user ? '/me' : '/login'}
              aria-label={user ? 'Profile' : 'Sign in'}
              className="focus-ring inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-transform hover:scale-105"
            >
              {user ? (
                <span className="bg-gradient-to-br from-brand-500 to-accent-500 bg-clip-text text-xs font-bold uppercase text-transparent">
                  {(user.displayName ?? user.email ?? '?').slice(0, 1)}
                </span>
              ) : (
                <UserCircle2 className="h-4 w-4 text-muted" />
              )}
            </Link>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] md:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom sheet — replaces the classic hamburger drawer */}
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={links}
        pathname={pathname ?? '/'}
        user={user}
      />
    </>
  );
}

function MobileNav({
  open,
  onClose,
  links,
  pathname,
  user,
}: {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  pathname: string;
  user: AuthUser | null;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in"
      />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 animate-fade-in-up">
        <div className="surface-elevated mx-3 mb-3 overflow-hidden rounded-3xl shadow-lg">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <span className="h-1.5 w-10 rounded-full bg-[rgb(var(--border-strong))]" />
          </div>

          <div className="flex items-center justify-between px-5 pb-3 pt-1">
            <div className="flex items-center gap-2">
              <WayraLogo className="h-7 w-7" />
              <span className="font-display text-base font-bold">Wayra</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgb(var(--border))]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="px-3 pb-3" aria-label="Mobile primary">
            <ul className="grid gap-1">
              {links.map(({ href, label, Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium transition-colors focus-ring',
                        active
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                          : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-muted))]',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-xl',
                          active
                            ? 'bg-brand-500 text-white'
                            : 'bg-[rgb(var(--surface-muted))] text-muted',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{label}</span>
                      {active && <span className="dot bg-accent-500" />}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Auth shortcut */}
            <div className="mt-3 border-t border-[rgb(var(--border))] pt-3">
              <Link
                href={user ? '/me' : '/login'}
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-medium text-[rgb(var(--text))] transition-colors hover:bg-[rgb(var(--surface-muted))] focus-ring"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                  <UserCircle2 className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  {user ? (user.displayName ?? user.email) : 'Sign in'}
                </span>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
