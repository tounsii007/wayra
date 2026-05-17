'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import { localeMetadata } from '@wayra/i18n';
import { SUPPORTED_LOCALES } from '@wayra/shared';
import type { Locale } from '@wayra/types';
import { cn } from '@/lib/utils';

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
      <Globe className="pointer-events-none absolute left-3 h-4 w-4 text-subtle" />
      <select
        aria-label="Language"
        value={current}
        onChange={(e) => onChange(e.target.value as Locale)}
        disabled={isPending}
        className={cn(
          'glass focus-ring h-9 cursor-pointer appearance-none rounded-full pl-9 pr-7 text-sm font-medium',
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
