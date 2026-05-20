'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { localeMetadata } from '@wayra/i18n';
import { SUPPORTED_LOCALES } from '@wayra/shared';
import type { Locale } from '@wayra/types';
import { cn } from '@/lib/utils';

/**
 * Locale switcher — a custom-styled native select.  Globe icon on the left,
 * chevron on the right, brand focus ring.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const current = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  function onChange(next: Locale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      window.location.reload();
    });
  }

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Globe className="text-subtle pointer-events-none absolute left-3 h-3.5 w-3.5" />
      <ChevronDown className="text-subtle pointer-events-none absolute right-2.5 h-3.5 w-3.5" />
      <select
        aria-label="Language"
        value={current}
        onChange={(e) => onChange(e.target.value as Locale)}
        disabled={isPending}
        className={cn(
          'focus-ring h-9 cursor-pointer appearance-none rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] pl-9 pr-7 text-xs font-semibold text-[rgb(var(--text))] transition-all hover:bg-[rgb(var(--surface-muted))]',
          isPending && 'opacity-60',
        )}
      >
        {SUPPORTED_LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {localeMetadata[loc].nativeLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
