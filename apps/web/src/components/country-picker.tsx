'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { MVP_COUNTRIES, COUNTRY_NAMES } from '@wayra/shared';
import type { CountryCode, Locale } from '@wayra/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const flagFor: Record<CountryCode, string> = {
  DE: '🇩🇪',
  FR: '🇫🇷',
  TN: '🇹🇳',
  AT: '🇦🇹',
  CH: '🇨🇭',
  BE: '🇧🇪',
  NL: '🇳🇱',
  IT: '🇮🇹',
  ES: '🇪🇸',
  MA: '🇲🇦',
  DZ: '🇩🇿',
};

export function CountryPicker() {
  const t = useTranslations('home.sections');
  const locale = useLocale() as Locale;
  const [selected, setSelected] = useState<CountryCode>('DE');

  return (
    <section aria-labelledby="countries-title">
      <h2 id="countries-title" className="mb-4 text-lg font-semibold">
        {t('exploreCountries')}
      </h2>
      <div className="flex flex-wrap gap-2">
        {MVP_COUNTRIES.map((cc) => {
          const active = selected === cc;
          return (
            <button
              key={cc}
              type="button"
              onClick={() => setSelected(cc)}
              className={cn(
                'focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                active
                  ? 'border-brand-500 bg-brand-500 shadow-glow text-white'
                  : 'border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-muted))]',
              )}
            >
              <span aria-hidden className="text-base leading-none">
                {flagFor[cc]}
              </span>
              {COUNTRY_NAMES[cc]?.[locale] ?? COUNTRY_NAMES[cc]?.en ?? cc}
            </button>
          );
        })}
      </div>
    </section>
  );
}
