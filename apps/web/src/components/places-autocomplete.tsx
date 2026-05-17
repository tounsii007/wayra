'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Loader2, X } from 'lucide-react';
import { fuzzyScore } from '@wayra/shared';
import type { Place, PlaceSuggestion, PlaceType } from '@wayra/types';
import { cn } from '@/lib/utils';
import { typeIconFor } from './place-icon';
import { sampleSuggestions } from '@/data/sample-suggestions';
import { useRecentStore } from '@/lib/recent-store';

interface Props {
  placeholder?: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
  className?: string;
  /** Show "use current location" suggestion */
  allowCurrentLocation?: boolean;
  ariaLabel?: string;
}

export function PlacesAutocomplete({
  placeholder,
  value,
  onChange,
  className,
  allowCurrentLocation,
  ariaLabel,
}: Props) {
  const t = useTranslations('search');
  const inputId = useId();
  const [query, setQuery] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const recents = useRecentStore((s) => s.recents);
  const pushRecent = useRecentStore((s) => s.push);

  // Sync external `value` → input text
  useEffect(() => {
    setQuery(value?.name ?? '');
  }, [value]);

  // Debounced "search" — for the MVP we filter the sample dataset client-side.
  // Production: this calls /api/places/autocomplete on the backend.
  useEffect(() => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      const scored = sampleSuggestions
        .map<PlaceSuggestion>((place) => ({
          place,
          score: fuzzyScore(query, place.name),
        }))
        .filter((s) => s.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      setSuggestions(scored);
      setActiveIndex(0);
      setLoading(false);
    }, 120);
    return () => clearTimeout(handle);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function pick(p: Place | null) {
    onChange(p);
    setQuery(p?.name ?? '');
    setOpen(false);
    if (p) pushRecent(p);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const picked = suggestions[activeIndex]?.place;
      if (picked) {
        e.preventDefault();
        pick(picked);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-subtle" />
        <input
          id={inputId}
          type="text"
          dir="auto"
          inputMode="search"
          autoComplete="off"
          aria-label={ariaLabel ?? placeholder ?? t('placeholder')}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${inputId}-listbox`}
          placeholder={placeholder ?? t('placeholder')}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (e.target.value === '') onChange(null);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            'w-full rounded-2xl pl-12 pr-10 py-4 text-base font-medium',
            'surface focus-ring',
            'placeholder:text-subtle',
            'transition-shadow',
          )}
        />
        {(query || value) && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => pick(null)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-subtle hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-muted))] focus-ring"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (loading || suggestions.length > 0 || query.length > 0) && (
        <div
          id={`${inputId}-listbox`}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl surface shadow-card animate-fade-in"
        >
          {loading && suggestions.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('placeholder')}</span>
            </div>
          )}
          {!loading && suggestions.length === 0 && query.length > 0 && (
            <div className="px-4 py-3 text-sm text-muted">{t('noResults')}</div>
          )}
          <ul className="max-h-80 overflow-y-auto">
            {allowCurrentLocation && query.length === 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => pick(null)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-[rgb(var(--surface-muted))]"
                >
                  <MapPin className="h-4 w-4 text-brand-500" />
                  <span className="text-sm font-medium">{t('useLocation')}</span>
                </button>
              </li>
            )}
            {query.length === 0 && recents.length > 0 && (
              <>
                <li className="px-4 pt-3 text-[10px] font-bold uppercase tracking-wider text-subtle">
                  Recent
                </li>
                {recents.map((p) => {
                  const Icon = typeIconFor(p.type);
                  return (
                    <li key={`recent-${p.id}`}>
                      <button
                        type="button"
                        onClick={() => pick(p)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-[rgb(var(--surface-muted))]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full surface-muted">
                          <Icon className="h-4 w-4 text-muted" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{p.name}</div>
                          <div className="truncate text-xs text-subtle">
                            <PlaceTypeLabel type={p.type} /> · {p.countryCode}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </>
            )}
            {suggestions.map((s, i) => {
              const Icon = typeIconFor(s.place.type);
              const isActive = i === activeIndex;
              return (
                <li key={s.place.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(s.place)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-start transition-colors',
                      isActive && 'bg-[rgb(var(--surface-muted))]',
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/15">
                      <Icon className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{s.place.name}</div>
                      <div className="truncate text-xs text-subtle">
                        <PlaceTypeLabel type={s.place.type} /> · {s.place.countryCode}
                        {s.place.address?.city ? ` · ${s.place.address.city}` : ''}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function PlaceTypeLabel({ type }: { type: PlaceType }) {
  const t = useTranslations('search.types');
  return <>{t(type)}</>;
}
