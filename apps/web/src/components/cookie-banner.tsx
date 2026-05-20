'use client';

import { useEffect, useState } from 'react';
import { Cookie, Shield, X } from 'lucide-react';

const KEY = 'wayra-consent-v1';
type Consent = { essential: true; analytics: boolean; marketing: boolean; ts: number };

function readConsent(): Consent | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
}

/**
 * GDPR-aware cookie consent banner.  Styled as a paper-warm ticket that
 * slides up from the bottom; remembered choice is persisted in localStorage
 * + a duplicate cookie so the SSR layer can also see it.
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(!readConsent());
  }, []);

  if (!open) return null;

  function save(analytics: boolean, marketing: boolean) {
    const c: Consent = { essential: true, analytics, marketing, ts: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(c));
    document.cookie = `wayra_consent=${analytics ? 1 : 0}${marketing ? 1 : 0}; path=/; max-age=31536000; SameSite=Lax`;
    setOpen(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="animate-fade-in-up fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl"
    >
      <div className="ticket relative overflow-hidden p-5 shadow-lg">
        {/* Top accent bar */}
        <div className="from-brand-500 via-accent-500 to-brand-500 absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r" />

        <div className="flex flex-wrap items-start gap-4">
          <span className="from-accent-400 to-accent-600 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md">
            <Cookie className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-base font-bold tracking-tight">
              Your privacy matters
            </div>
            <p className="text-muted mt-1.5 text-sm leading-relaxed">
              Wayra uses essential storage to keep you signed in, remember your language and theme,
              and cache the offline regions you download. We don&apos;t run analytics or marketing
              trackers by default — opt in only if you want.{' '}
              <a
                className="link-editorial text-brand-700 dark:text-brand-300 font-semibold"
                href="/privacy"
              >
                Read more
              </a>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => save(false, false)}
            aria-label="Dismiss — essential only"
            className="focus-ring text-subtle inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[rgb(var(--surface-muted))] hover:text-[rgb(var(--text))]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={() => save(false, false)} className="btn-ghost text-xs">
            Essential only
          </button>
          <button onClick={() => save(true, false)} className="btn-surface text-xs">
            + Analytics
          </button>
          <button onClick={() => save(true, true)} className="btn-primary ms-auto text-xs">
            <Shield className="h-3.5 w-3.5" />
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
