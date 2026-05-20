'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Search as SearchIcon,
  X,
  Loader2,
  ArrowUpRight,
  Train,
  Bus,
  TramFront,
  Building2,
  Plane,
  Globe2,
} from 'lucide-react';
import { fuzzyScore } from '@wayra/shared';
import type { Place, PlaceSuggestion, PlaceType } from '@wayra/types';
import { sampleSuggestions } from '@/data/sample-suggestions';
import { typeIconFor } from '@/components/place-icon';
import { cn } from '@/lib/utils';

interface ApiSuggestionsResponse {
  data?: { suggestions: PlaceSuggestion[] };
  error?: { message: string };
}

const FILTERS: Array<{ value: PlaceType | 'all'; label: string; Icon: typeof Globe2 }> = [
  { value: 'all', label: 'All', Icon: Globe2 },
  { value: 'city', label: 'Cities', Icon: Building2 },
  { value: 'station', label: 'Stations', Icon: Train },
  { value: 'metro_station', label: 'Metro', Icon: Train },
  { value: 'tram_stop', label: 'Tram', Icon: TramFront },
  { value: 'bus_stop', label: 'Bus', Icon: Bus },
  { value: 'airport', label: 'Airports', Icon: Plane },
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
    <div className="space-y-6">
      {/* Big search input */}
      <div
        className={cn(
          'relative flex items-center rounded-3xl border bg-[rgb(var(--bg-elevated))] shadow-lg transition-all',
          'border-[rgb(var(--border))]',
          'focus-within:border-brand-500/60 focus-within:shadow-[0_0_0_4px_rgb(13_148_136_/_0.12)]',
        )}
      >
        <span className="from-brand-500 to-brand-700 ml-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm">
          <SearchIcon className="h-5 w-5" />
        </span>
        <input
          autoFocus
          dir="auto"
          type="search"
          inputMode="search"
          aria-label={tSearch('placeholder')}
          placeholder={tSearch('placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="placeholder:text-subtle w-full bg-transparent px-4 py-5 text-lg font-medium outline-none"
        />
        {loading && <Loader2 className="text-brand-500 mr-3 h-4 w-4 animate-spin" aria-hidden />}
        {query && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => setQuery('')}
            className="focus-ring text-subtle mr-3 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgb(var(--surface-muted))] hover:text-[rgb(var(--text))]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chips with icons */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(({ value, label, Icon }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'focus-ring inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                active
                  ? 'border-brand-500 bg-brand-500 shadow-glow text-white'
                  : 'text-muted border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:-translate-y-0.5 hover:text-[rgb(var(--text))]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Status row */}
      {usedFallback && query && (
        <div className="chip-amber inline-flex">
          <Loader2 className="h-3 w-3 animate-spin" />
          Backend unreachable — offline results
        </div>
      )}

      {/* Result count */}
      {query && !loading && filtered.length > 0 && (
        <p className="text-subtle font-mono text-[11px] uppercase tracking-[0.18em]">
          <span className="board-num">{filtered.length}</span> result
          {filtered.length === 1 ? '' : 's'} ·{' '}
          {filter === 'all' ? 'all types' : FILTERS.find((f) => f.value === filter)?.label}
        </p>
      )}

      {/* Results */}
      {loading && !filtered.length ? (
        <ResultsSkeleton />
      ) : !query ? (
        <EmptyHint />
      ) : filtered.length === 0 ? (
        <NoResults />
      ) : (
        <ul className="grid gap-2">
          {filtered.map((s, i) => (
            <ResultRow key={s.place.id} place={s.place} score={s.score} index={i} />
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
        <li key={i} className="skeleton h-16 rounded-2xl" />
      ))}
    </ul>
  );
}

function EmptyHint() {
  const suggestions = ['Frankfurt Hbf', 'Paris Gare du Nord', 'Tunis Marine', 'Milano Centrale'];
  return (
    <div className="ticket relative overflow-hidden p-8 text-center">
      <SearchIcon className="text-brand-500 mx-auto h-8 w-8" />
      <h3 className="font-display mt-3 text-xl font-bold tracking-tight">Start typing</h3>
      <p className="text-muted mt-2 text-sm">Find any station, stop or city across the network</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {suggestions.map((name) => (
          <Link
            key={name}
            href={`/search?q=${encodeURIComponent(name)}`}
            className="chip-surface text-xs"
          >
            {name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NoResults() {
  return (
    <div className="surface-elevated rounded-3xl p-8 text-center">
      <p className="font-display text-xl font-bold tracking-tight">No matches</p>
      <p className="text-muted mt-1 text-sm">
        Try a different spelling, or check our covered countries above.
      </p>
    </div>
  );
}

function ResultRow({ place, score, index }: { place: Place; score?: number; index: number }) {
  const Icon = typeIconFor(place.type);
  const tSearch = useTranslations('search.types');
  return (
    <li>
      <Link
        href={`/stops/${encodeURIComponent(place.id)}`}
        className="ticket focus-ring group flex items-center gap-3 p-4"
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      >
        <span className="from-brand-500 to-brand-700 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display truncate text-base font-bold tracking-tight">
            {place.name}
          </div>
          <div className="text-subtle truncate text-xs">
            {tSearch(place.type)} · {place.countryCode}
            {place.address?.city ? ` · ${place.address.city}` : ''}
          </div>
        </div>
        {score !== undefined && (
          <span className="text-subtle hidden font-mono text-[10px] tabular-nums sm:inline">
            {Math.round(score * 100)}%
          </span>
        )}
        <ArrowUpRight className="text-subtle h-4 w-4 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[rgb(var(--text))]" />
      </Link>
    </li>
  );
}
