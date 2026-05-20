'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { fuzzyScore } from '@wayra/shared';
import type { Place, PlaceSuggestion, PlaceType } from '@wayra/types';
import { sampleSuggestions } from '@/data/sample-suggestions';
import { typeIconFor } from '@/components/place-icon';

interface ApiSuggestionsResponse {
  data?: { suggestions: PlaceSuggestion[] };
  error?: { message: string };
}

const FILTERS: Array<{ value: PlaceType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'city', label: 'Cities' },
  { value: 'station', label: 'Stations' },
  { value: 'metro_station', label: 'Metro' },
  { value: 'tram_stop', label: 'Tram' },
  { value: 'bus_stop', label: 'Bus' },
  { value: 'airport', label: 'Airports' },
];

export function SearchClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const tSearch = useTranslations('search');
  const initialQ = sp.get('q') ?? '';
  const initialType = (sp.get('type') ?? 'all') as PlaceType | 'all';

  const [query, setQuery] = useState(initialQ);
  const [filter, setFilter] = useState<PlaceType | 'all'>(initialType);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  // Backend-driven search, with in-memory fallback if the API is unreachable.
  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      setUsedFallback(false);
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const ctrl = new AbortController();
    setLoading(true);
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/search?q=${encodeURIComponent(query)}&limit=20`, {
          signal: ctrl.signal,
        });
        const payload = (await res.json()) as ApiSuggestionsResponse;
        if (payload.error) throw new Error(payload.error.message);
        setSuggestions(payload.data?.suggestions ?? []);
        setUsedFallback(false);
      } catch {
        // Fallback to in-memory data
        const fb = sampleSuggestions
          .map<PlaceSuggestion>((p) => ({ place: p, score: fuzzyScore(query, p.name) }))
          .filter((s) => s.score > 0.2)
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);
        setSuggestions(fb);
        setUsedFallback(true);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      ctrl.abort();
      clearTimeout(debounce);
    };
  }, [query]);

  // Reflect into URL so results are linkable
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filter !== 'all') params.set('type', filter);
    router.replace(`/search?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter]);

  const filtered = useMemo(
    () => (filter === 'all' ? suggestions : suggestions.filter((s) => s.place.type === filter)),
    [suggestions, filter],
  );

  return (
    <div className="space-y-5">
      <div className="relative">
        <SearchIcon className="text-subtle pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />
        <input
          autoFocus
          dir="auto"
          type="search"
          inputMode="search"
          aria-label={tSearch('placeholder')}
          placeholder={tSearch('placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="surface focus-ring placeholder:text-subtle w-full rounded-2xl py-4 pl-12 pr-12 text-base font-medium"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => setQuery('')}
            className="text-subtle focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-[rgb(var(--surface-muted))]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`focus-ring rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.value
                ? 'bg-brand-500 text-white'
                : 'text-muted border border-[rgb(var(--border))] hover:text-[rgb(var(--text))]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {usedFallback && query && (
        <div className="surface-muted text-muted inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Backend unreachable — showing in-memory results.
        </div>
      )}

      {loading && !filtered.length ? (
        <ResultsSkeleton />
      ) : !query ? (
        <EmptyHint />
      ) : filtered.length === 0 ? (
        <p className="text-muted text-sm">{tSearch('noResults')}</p>
      ) : (
        <ul className="surface divide-y divide-[rgb(var(--border))] overflow-hidden rounded-2xl">
          {filtered.map((s) => (
            <ResultRow key={s.place.id} place={s.place} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="skeleton h-14 rounded-2xl" />
      ))}
    </ul>
  );
}

function EmptyHint() {
  return (
    <div className="surface text-muted rounded-2xl p-6 text-sm">
      Try searching for <span className="font-semibold">Frankfurt Hbf</span>,{' '}
      <span className="font-semibold">Paris Gare du Nord</span> or{' '}
      <span className="font-semibold">Tunis Marine</span>.
    </div>
  );
}

function ResultRow({ place }: { place: Place }) {
  const Icon = typeIconFor(place.type);
  const tSearch = useTranslations('search.types');
  return (
    <li>
      <Link
        href={`/stops/${encodeURIComponent(place.id)}`}
        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[rgb(var(--surface-muted))]"
      >
        <span className="bg-brand-50 dark:bg-brand-500/15 inline-flex h-10 w-10 items-center justify-center rounded-full">
          <Icon className="text-brand-600 dark:text-brand-300 h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{place.name}</div>
          <div className="text-subtle truncate text-xs">
            {tSearch(place.type)} · {place.countryCode}
            {place.address?.city ? ` · ${place.address.city}` : ''}
          </div>
        </div>
      </Link>
    </li>
  );
}
