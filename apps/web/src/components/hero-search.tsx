'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, ArrowDownUp, Clock, LocateFixed } from 'lucide-react';
import type { Place } from '@wayra/types';
import { PlacesAutocomplete } from './places-autocomplete';
import { cn } from '@/lib/utils';

type Mode = 'depart' | 'arrive';

export function HeroSearch() {
  const t = useTranslations('home.hero');
  const router = useRouter();
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [mode, setMode] = useState<Mode>('depart');
  const [when, setWhen] = useState<string>('');

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set('from', from.id);
    if (to) params.set('to', to.id);
    if (when) params.set(mode === 'depart' ? 'departAt' : 'arriveBy', when);
    router.push(`/plan?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="glass-strong rounded-[28px] p-3 sm:p-4 shadow-card">
      <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <PlacesAutocomplete
          value={from}
          onChange={setFrom}
          placeholder={t('fromPlaceholder')}
          allowCurrentLocation
          ariaLabel={t('fromPlaceholder')}
        />

        <button
          type="button"
          aria-label="Swap from and to"
          onClick={swap}
          className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full surface focus-ring hover:rotate-180 transition-transform duration-300"
        >
          <ArrowDownUp className="h-4 w-4" />
        </button>

        <PlacesAutocomplete
          value={to}
          onChange={setTo}
          placeholder={t('toPlaceholder')}
          ariaLabel={t('toPlaceholder')}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleChip active={mode === 'depart'} onClick={() => setMode('depart')}>
            <Clock className="h-3.5 w-3.5" />
            {t('departAt')}
          </ToggleChip>
          <ToggleChip active={mode === 'arrive'} onClick={() => setMode('arrive')}>
            <ArrowRight className="h-3.5 w-3.5" />
            {t('arriveBy')}
          </ToggleChip>
          <input
            type="datetime-local"
            aria-label={mode === 'depart' ? t('departAt') : t('arriveBy')}
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="surface focus-ring rounded-full text-sm px-3 py-1.5"
          />
          <button
            type="button"
            onClick={() => setWhen('')}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-muted))] focus-ring"
          >
            {t('now')}
          </button>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-600 transition-colors focus-ring"
        >
          {t('plan')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 focus-ring"
      >
        <LocateFixed className="h-3.5 w-3.5" />
        {t('useCurrentLocation')}
      </button>
    </form>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-ring',
        active
          ? 'bg-brand-500 text-white'
          : 'surface text-muted hover:text-[rgb(var(--text))]',
      )}
    >
      {children}
    </button>
  );
}
