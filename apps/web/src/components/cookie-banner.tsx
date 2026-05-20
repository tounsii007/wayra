'use client';

import { useEffect, useState } from 'react';
import { Cookie, Shield } from 'lucide-react';

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
 * GDPR-aware cookie consent banner. Wayra's first-party storage
 * (auth, recents, theme, locale, prefs) is all "essential" so the
 * banner doesn't gate it — but if/when analytics or marketing cookies
 * are added, gate them on `useConsent('analytics')`.
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
      className="shadow-card fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4"
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="bg-brand-500/10 text-brand-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold">Your privacy matters</div>
          <p className="text-muted mt-1 text-sm">
            We use essential storage to keep you signed in, remember your language and theme, and
            cache offline regions you choose to download. We don't run analytics or marketing
            trackers by default — opt in only if you want.{' '}
            <a className="text-brand-500 font-semibold underline" href="/privacy">
              Read more
            </a>
            .
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => save(false, false)}
          className="surface-muted focus-ring rounded-full px-3 py-1.5 text-xs font-bold"
        >
          Essential only
        </button>
        <button
          onClick={() => save(true, false)}
          className="surface-muted focus-ring rounded-full px-3 py-1.5 text-xs font-bold"
        >
          Essential + analytics
        </button>
        <button
          onClick={() => save(true, true)}
          className="bg-brand-500 shadow-glow focus-ring ms-auto inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white"
        >
          <Shield className="h-3 w-3" />
          Accept all
        </button>
      </div>
    </div>
  );
}
