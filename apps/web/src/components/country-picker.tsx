'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MVP_COUNTRIES, COUNTRY_NAMES } from '@wayra/shared';
import type { CountryCode, Locale } from '@wayra/types';
import { ArrowRight, Globe2 } from 'lucide-react';
import Link from 'next/link';
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

// Editorial-style data per country.  Real numbers would come from an API.
const COUNTRY_FACTS: Record<CountryCode, { stops: string; cities: string; modes: string }> = {
  DE: { stops: '52k+', cities: '120', modes: 'rail · S-Bahn · bus · tram' },
  FR: { stops: '38k+', cities: '88', modes: 'TGV · RER · métro · bus' },
  TN: { stops: '2.1k', cities: '14', modes: 'TGM · métro léger · bus' },
  AT: { stops: '14k+', cities: '32', modes: 'ÖBB · S-Bahn · tram' },
  CH: { stops: '12k+', cities: '28', modes: 'SBB · tram · bus' },
  BE: { stops: '8.4k', cities: '22', modes: 'SNCB · tram · bus' },
  NL: { stops: '9.2k', cities: '24', modes: 'NS · metro · tram · bus' },
  IT: { stops: '24k+', cities: '52', modes: 'Trenitalia · metro · bus' },
  ES: { stops: '18k+', cities: '40', modes: 'Renfe · metro · bus' },
  MA: { stops: '3.4k', cities: '18', modes: 'ONCF · bus · tram' },
  DZ: { stops: '2.8k', cities: '12', modes: 'SNTF · métro · tram' },
};

export function CountryPicker() {
  const t = useTranslations('home.sections');
  const locale = useLocale() as Locale;
  const [selected, setSelected] = useState<CountryCode>('DE');

  const fact = COUNTRY_FACTS[selected];
  const name = COUNTRY_NAMES[selected]?.[locale] ?? COUNTRY_NAMES[selected]?.en ?? selected;

  return (
    <section aria-labelledby="countries-title">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip-brand">
            <Globe2 className="h-3 w-3" />
            Coverage
          </span>
          <h2
            id="countries-title"
            className="mt-3 font-display text-display-sm font-bold tracking-tightest display-tight"
          >
            {t('exploreCountries')}
          </h2>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Country chip cloud */}
        <div className="surface-elevated rounded-3xl p-4">
          <ul className="flex flex-wrap gap-2" role="tablist" aria-label="Countries">
            {MVP_COUNTRIES.map((cc) => {
              const active = selected === cc;
              return (
                <li key={cc}>
                  <button
                    type="button"
                    onClick={() => setSelected(cc)}
                    role="tab"
                    aria-selected={active}
                    className={cn(
                      'focus-ring inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all',
                      active
                        ? 'border-brand-500 bg-brand-500 text-white shadow-glow scale-105'
                        : 'border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text))] hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-[rgb(var(--surface-muted))]',
                    )}
                  >
                    <span aria-hidden className="text-base leading-none">
                      {flagFor[cc]}
                    </span>
                    {COUNTRY_NAMES[cc]?.[locale] ?? COUNTRY_NAMES[cc]?.en ?? cc}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* World coverage hint */}
          <p className="mt-4 text-xs text-subtle">
            <Globe2 className="mr-1 inline h-3 w-3" />
            11 countries covered · more coming soon
          </p>
        </div>

        {/* Detail card for selected country */}
        <div className="ticket relative overflow-hidden p-6 sm:p-8" role="tabpanel">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-500/0 blur-2xl" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl leading-none" aria-hidden>
                  {flagFor[selected]}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight">{name}</h3>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-subtle">
                    {selected} · {fact.modes}
                  </p>
                </div>
              </div>
            </div>
            <Link
              href={`/search?country=${selected}`}
              className="btn-surface text-xs"
              aria-label={`Explore ${name}`}
            >
              Explore
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Stats row */}
          <dl className="mt-6 grid grid-cols-3 gap-4">
            <Stat label="Stops indexed" value={fact.stops} />
            <Stat label="Cities" value={fact.cities} />
            <Stat label="Live feeds" value={selected === 'TN' ? '2' : '6+'} />
          </dl>

          {/* Decorative route map */}
          <svg
            viewBox="0 0 280 50"
            aria-hidden
            className="mt-6 w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M 6 25 Q 60 5 110 25 T 220 25 T 274 25"
              fill="none"
              stroke="rgb(var(--brand))"
              strokeWidth="2"
              strokeLinecap="round"
              className="route-line"
            />
            <circle cx="6" cy="25" r="4" className="fill-brand-500" />
            <circle cx="110" cy="25" r="3" className="fill-amber-500" />
            <circle cx="220" cy="25" r="3" className="fill-amber-500" />
            <circle cx="274" cy="25" r="4" className="fill-accent-500" />
          </svg>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl font-bold tracking-tight">
        <span className="board-num">{value}</span>
      </dd>
    </div>
  );
}
