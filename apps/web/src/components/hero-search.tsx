'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  ArrowDownUp,
  Clock,
  LocateFixed,
  Calendar,
  Users,
  Accessibility,
} from 'lucide-react';
import type { Place } from '@wayra/types';
import { PlacesAutocomplete } from './places-autocomplete';
import { cn } from '@/lib/utils';

type Mode = 'depart' | 'arrive';

/**
 * Hero search "ticket" — the central interactive element of the home page.
 *
 * Tactile, paper-like card with a route-line motif between origin and
 * destination, a swap coin in the middle, mode/time/passenger chips on a
 * dotted-divider row below, and a primary CTA.
 */
export function HeroSearch() {
  const t = useTranslations('home.hero');
  const router = useRouter();
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [mode, setMode] = useState<Mode>('depart');
  const [when, setWhen] = useState<string>('');
  const [passengers, setPassengers] = useState(1);
  const [wheelchair, setWheelchair] = useState(false);

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
    if (passengers > 1) params.set('passengers', String(passengers));
    if (wheelchair) params.set('wheelchair', '1');
    router.push(`/plan?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="relative mx-auto max-w-4xl" aria-label="Plan a trip">
      {/* Decorative ticket-stub glow on the sides */}
      <div className="bg-accent-500/20 pointer-events-none absolute -left-1.5 top-1/3 hidden h-32 w-3 -translate-y-1/2 rounded-r-full blur-md md:block" />
      <div className="bg-brand-500/20 pointer-events-none absolute -right-1.5 top-1/3 hidden h-32 w-3 -translate-y-1/2 rounded-l-full blur-md md:block" />

      <div className="ticket relative overflow-hidden p-3 shadow-lg sm:p-5">
        {/* From / Swap / To */}
        <div className="relative grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
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
            className="focus-ring text-muted group relative mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] shadow-sm transition-all duration-300 hover:scale-105 hover:text-[rgb(var(--text))] hover:shadow-md active:scale-95"
          >
            <ArrowDownUp className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180 md:rotate-90 md:group-hover:rotate-[270deg]" />
          </button>

          <PlacesAutocomplete
            value={to}
            onChange={setTo}
            placeholder={t('toPlaceholder')}
            ariaLabel={t('toPlaceholder')}
          />
        </div>

        {/* Dotted divider — like a ticket perforation */}
        <div className="divider-dotted mt-4" />

        {/* Mode + time + passengers + accessibility + submit */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Depart / Arrive segmented control */}
            <div
              role="radiogroup"
              aria-label="Time mode"
              className="inline-flex rounded-full bg-[rgb(var(--surface-muted))] p-0.5"
            >
              <ToggleSegment
                active={mode === 'depart'}
                onClick={() => setMode('depart')}
                label={t('departAt')}
                Icon={Clock}
              />
              <ToggleSegment
                active={mode === 'arrive'}
                onClick={() => setMode('arrive')}
                label={t('arriveBy')}
                Icon={ArrowRight}
              />
            </div>

            {/* Datetime — disguised as a chip */}
            <label className="focus-within:ring-brand-500/40 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-sm focus-within:ring-2">
              <Calendar className="text-muted h-3.5 w-3.5" />
              <input
                type="datetime-local"
                aria-label={mode === 'depart' ? t('departAt') : t('arriveBy')}
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="bg-transparent text-sm outline-none [color-scheme:light] dark:[color-scheme:dark]"
              />
            </label>
            <button
              type="button"
              onClick={() => setWhen('')}
              className="focus-ring text-muted rounded-full px-3 py-1.5 text-xs font-medium hover:bg-[rgb(var(--surface-muted))] hover:text-[rgb(var(--text))]"
            >
              {t('now')}
            </button>

            {/* Passenger stepper */}
            <Stepper
              value={passengers}
              onChange={setPassengers}
              min={1}
              max={9}
              Icon={Users}
              ariaLabel="Passengers"
            />

            {/* Accessibility toggle */}
            <button
              type="button"
              onClick={() => setWheelchair((v) => !v)}
              aria-pressed={wheelchair}
              aria-label="Wheelchair accessible"
              className={cn(
                'focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
                wheelchair
                  ? 'border-brand-500/60 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  : 'text-muted border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:text-[rgb(var(--text))]',
              )}
            >
              <Accessibility className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Accessible</span>
            </button>
          </div>

          <button type="submit" className="btn-primary group">
            {t('plan')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Current location + keyboard hint */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <button
            type="button"
            className="link-editorial focus-ring text-brand-700 dark:text-brand-300 inline-flex items-center gap-1.5 font-semibold"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            {t('useCurrentLocation')}
          </button>
          <span className="text-subtle hidden font-mono text-[10px] uppercase tracking-[0.18em] sm:inline">
            ↵ to plan
          </span>
        </div>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------- */

function ToggleSegment({
  active,
  onClick,
  label,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon: typeof Clock;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={active}
      className={cn(
        'focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
        active
          ? 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text))] shadow-sm'
          : 'text-muted hover:text-[rgb(var(--text))]',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
  Icon,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  Icon: typeof Users;
  ariaLabel: string;
}) {
  return (
    <div
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] pl-3 pr-1 text-sm"
      aria-label={ariaLabel}
    >
      <Icon className="text-muted h-3.5 w-3.5" />
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
        className="focus-ring text-muted h-7 w-7 rounded-full text-base font-bold hover:bg-[rgb(var(--surface-muted))] disabled:opacity-30"
      >
        −
      </button>
      <span className="board-num min-w-[1ch] text-center text-sm font-bold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
        className="focus-ring text-muted h-7 w-7 rounded-full text-base font-bold hover:bg-[rgb(var(--surface-muted))] disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
