'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Loader2, X, Clock4, ArrowUpRight, LocateFixed } from 'lucide-react';
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

/**
 * Places autocomplete — the most-touched input in Wayra.  Visually crafted
 * to feel premium: subtle inset glow on focus, animated icon slot, recent
 * searches with relative timestamps, RTL-aware text alignment, and a
 * keyboard-navigable result list with score percentages.
 */
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
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const recents = useRecentStore((s) => s.recents);
  const pushRecent = useRecentStore((s) => s.push);

  useEffect(() => {
    setQuery(value?.name ?? '');
  }, [value]);

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

  const hasValue = Boolean(query || value);

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {/* Input shell */}
      <div
        className={cn(
          'group relative flex items-center rounded-2xl border bg-[rgb(var(--bg-elevated))] transition-all duration-200',
          focused
            ? 'border-brand-500/60 shadow-[0_0_0_4px_rgb(13_148_136_/_0.12)]'
            : 'border-[rgb(var(--border))]',
        )}
      >
        <span
          className={cn(
            'pointer-events-none ml-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
            focused || hasValue
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
              : 'text-muted bg-[rgb(var(--surface-muted))]',
          )}
        >
          {value ? (
            (() => {
              const Icon = typeIconFor(value.type);
              return <Icon className="h-4 w-4" />;
            })()
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </span>

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
          onFocus={() => {
            setOpen(true);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (e.target.value === '') onChange(null);
          }}
          onKeyDown={onKeyDown}
          className="placeholder:text-subtle w-full bg-transparent px-3 py-3.5 text-base font-medium outline-none"
        />

        {hasValue && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => pick(null)}
            className="focus-ring text-subtle mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[rgb(var(--surface-muted))] hover:text-[rgb(var(--text))]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions panel */}
      {open &&
        (loading ||
          suggestions.length > 0 ||
          query.length > 0 ||
          (allowCurrentLocation && recents.length === 0)) && (
          <div
            id={`${inputId}-listbox`}
            role="listbox"
            className="surface-elevated animate-fade-in absolute z-30 mt-2 w-full overflow-hidden rounded-2xl shadow-lg"
          >
            {loading && suggestions.length === 0 && (
              <div className="text-muted flex items-center gap-2.5 px-4 py-3.5 text-sm">
                <Loader2 className="text-brand-500 h-4 w-4 animate-spin" />
                <span>Searching…</span>
              </div>
            )}

            {!loading && suggestions.length === 0 && query.length > 0 && (
              <div className="text-muted px-4 py-3.5 text-sm">{t('noResults')}</div>
            )}

            <ul className="max-h-[28rem] overflow-y-auto">
              {allowCurrentLocation && query.length === 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => pick(null)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-[rgb(var(--surface-muted))]"
                  >
                    <span className="from-brand-500 to-brand-700 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm">
                      <LocateFixed className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-semibold">{t('useLocation')}</span>
                    <ArrowUpRight className="text-subtle h-3.5 w-3.5" />
                  </button>
                  {recents.length > 0 && <div className="divider-dotted mx-4" />}
                </li>
              )}

              {query.length === 0 && recents.length > 0 && (
                <>
                  <li className="text-subtle flex items-center gap-2 px-4 pt-3 text-[10px] font-bold uppercase tracking-[0.18em]">
                    <Clock4 className="h-3 w-3" />
                    Recent
                  </li>
                  {recents.slice(0, 4).map((p) => {
                    const Icon = typeIconFor(p.type);
                    return (
                      <li key={`recent-${p.id}`}>
                        <button
                          type="button"
                          onClick={() => pick(p)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-[rgb(var(--surface-muted))]"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--surface-muted))]">
                            <Icon className="text-muted h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">{p.name}</div>
                            <div className="text-subtle truncate text-xs">
                              <PlaceTypeLabel type={p.type} /> · {p.countryCode}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </>
              )}

              {suggestions.length > 0 && query.length > 0 && (
                <li className="text-subtle px-4 pt-3 text-[10px] font-bold uppercase tracking-[0.18em]">
                  Results
                </li>
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
                        'group flex w-full items-center gap-3 px-4 py-3 text-start transition-colors',
                        isActive && 'bg-[rgb(var(--surface-muted))]',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                          isActive
                            ? 'from-brand-500 to-brand-700 bg-gradient-to-br text-white shadow-sm'
                            : 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{s.place.name}</div>
                        <div className="text-subtle truncate text-xs">
                          <PlaceTypeLabel type={s.place.type} /> · {s.place.countryCode}
                          {s.place.address?.city ? ` · ${s.place.address.city}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-mono text-[10px] tabular-nums opacity-60 transition-opacity group-hover:opacity-100',
                            isActive ? 'text-brand-700 dark:text-brand-300' : 'text-subtle',
                          )}
                        >
                          {Math.round(s.score * 100)}%
                        </span>
                        <ArrowUpRight
                          className={cn(
                            'h-3.5 w-3.5 transition-all',
                            isActive
                              ? 'text-brand-600 dark:text-brand-300 -translate-y-0.5 translate-x-0.5'
                              : 'text-subtle',
                          )}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {(suggestions.length > 0 || recents.length > 0) && (
              <div className="text-subtle flex items-center justify-end gap-3 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em]">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
                <span>esc close</span>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

function PlaceTypeLabel({ type }: { type: PlaceType }) {
  const t = useTranslations('search.types');
  return <>{t(type)}</>;
}
