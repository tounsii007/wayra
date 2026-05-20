'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Github, Globe2, Mail, Heart } from 'lucide-react';
import { WayraLogo } from './wayra-logo';

/**
 * Editorial footer — paper-warm, structured, with brand statement.
 */
export function SiteFooter() {
  const t = useTranslations('brand');
  const year = new Date().getFullYear();

  const sections: Array<{
    title: string;
    links: Array<{ href: string; label: string; external?: boolean }>;
  }> = [
    {
      title: 'Product',
      links: [
        { href: '/plan', label: 'Plan a trip' },
        { href: '/map', label: 'Map' },
        { href: '/live', label: 'Live status' },
        { href: '/assistant', label: 'AI assistant' },
      ],
    },
    {
      title: 'Coverage',
      links: [
        { href: '/?country=DE', label: 'Deutschland' },
        { href: '/?country=FR', label: 'France' },
        { href: '/?country=TN', label: 'Tunisie' },
        { href: '/about', label: 'All countries' },
      ],
    },
    {
      title: 'Company',
      links: [
        { href: '/about', label: 'About' },
        { href: '/privacy', label: 'Privacy' },
        { href: '/terms', label: 'Terms' },
        { href: 'https://github.com/tounsii007/wayra', label: 'GitHub', external: true },
      ],
    },
  ];

  return (
    <footer className="relative mt-12 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]/40">
      {/* Top route-line decoration */}
      <div className="via-brand-500/50 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_3fr]">
          {/* Brand block */}
          <div className="space-y-5">
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-2.5 rounded-xl"
              aria-label="Wayra — home"
            >
              <WayraLogo className="h-9 w-9" />
              <span className="font-display tracking-tightest text-xl font-bold">Wayra</span>
            </Link>

            <p className="text-muted max-w-sm text-pretty text-sm leading-relaxed">
              {t('tagline')}. Trains, buses, metros — across Europe and North&nbsp;Africa, in one
              beautifully designed app.
            </p>

            {/* Coverage chips */}
            <div className="flex flex-wrap gap-1.5">
              {['🇩🇪 DE', '🇫🇷 FR', '🇹🇳 TN', '🇮🇹 IT', '🇪🇸 ES', '🇲🇦 MA'].map((c) => (
                <span key={c} className="chip-surface text-[11px]">
                  {c}
                </span>
              ))}
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://github.com/tounsii007/wayra"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="focus-ring surface text-muted inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:text-[rgb(var(--text))]"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@wayra.app"
                aria-label="Email"
                className="focus-ring surface text-muted inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:text-[rgb(var(--text))]"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://wayra.app"
                aria-label="Website"
                className="focus-ring surface text-muted inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:text-[rgb(var(--text))]"
              >
                <Globe2 className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link grid */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="font-display mb-3 text-sm font-semibold tracking-wide text-[rgb(var(--text))]">
                  {section.title}
                </h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="link-editorial text-muted text-sm hover:text-[rgb(var(--text))]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="link-editorial text-muted text-sm hover:text-[rgb(var(--text))]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="text-subtle mt-10 flex flex-col-reverse items-start justify-between gap-3 border-t border-[rgb(var(--border))] pt-6 text-xs sm:flex-row sm:items-center">
          <p>
            © {year} {t('name')} · Built with{' '}
            <Heart className="text-accent-600 inline h-3 w-3 -translate-y-px" /> in the
            Mediterranean
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em]">v0.6 · {t('tagline')}</p>
        </div>
      </div>
    </footer>
  );
}
