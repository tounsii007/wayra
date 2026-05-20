'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  LogOut,
  Trash2,
  Sparkles,
  Bookmark,
  BellRing,
  ArrowUpRight,
  Settings2,
  Home,
  Briefcase,
  MapPin,
  Train,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { sampleSuggestions } from '@/data/sample-suggestions';
import { cn } from '@/lib/utils';

interface Favorite {
  id: string;
  kind: 'home' | 'work' | 'custom';
  label: string | null;
  placeId: string | null;
}

interface SavedRoute {
  id: string;
  label: string | null;
  data: { from?: string; to?: string };
  notifyOnDisruption: boolean;
}

export function ProfileClient() {
  const router = useRouter();
  const { token, user, clear } = useAuthStore();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    (async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [favRes, routesRes] = await Promise.all([
          fetch(`${base}/api/me/favorites`, { headers }),
          fetch(`${base}/api/me/routes`, { headers }),
        ]);
        const favJson = (await favRes.json()) as { data?: Favorite[] };
        const routesJson = (await routesRes.json()) as { data?: SavedRoute[] };
        setFavorites(favJson.data ?? []);
        setRoutes(routesJson.data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, router]);

  async function removeFavorite(id: string) {
    if (!token) return;
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    await fetch(`${base}/api/me/favorites/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setFavorites((f) => f.filter((x) => x.id !== id));
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* ---- Hero / identity card ---------------------------------- */}
      <header className="ticket relative overflow-hidden">
        <div className="from-brand-500 via-accent-500 to-brand-500 h-[3px] bg-gradient-to-r" />
        <div className="relative p-6 sm:p-8">
          <div className="from-brand-500/30 via-accent-500/20 pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br to-transparent blur-3xl" />

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="from-brand-500 via-brand-700 to-accent-600 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br text-2xl font-bold text-white shadow-md">
                  {(user.displayName ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                </div>
                <span className="bg-status-onTime absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-white ring-4 ring-[rgb(var(--bg-elevated))]">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </div>
              <div className="min-w-0">
                <span className="chip-brand text-[10px]">
                  <Sparkles className="h-3 w-3" />
                  Traveler
                </span>
                <h1 className="font-display text-display-sm tracking-tightest display-tight mt-2 font-bold">
                  {user.displayName ?? 'Welcome back'}
                </h1>
                <p className="text-subtle mt-1 truncate font-mono text-xs uppercase tracking-[0.18em]">
                  {user.email}
                  {user.role === 'admin' && (
                    <span className="bg-accent-500/15 text-accent-700 dark:text-accent-400 ml-2 inline-flex items-center rounded-full px-1.5 py-0.5">
                      admin
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-1.5">
              <Link href="/settings" className="btn-surface" aria-label="Settings">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  clear();
                  router.replace('/');
                }}
                className="btn-ghost"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>

          {/* Stats row */}
          <dl className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
            <Stat label="Favourites" value={loading ? '—' : String(favorites.length)} />
            <Stat label="Saved trips" value={loading ? '—' : String(routes.length)} />
            <Stat label="Notifications" value="On" />
            <Stat label="Member since" value="2024" className="hidden sm:block" />
          </dl>
        </div>
      </header>

      {/* ---- Favourites -------------------------------------------- */}
      <section>
        <header className="mb-4 flex items-end justify-between">
          <div>
            <span className="chip-amber">
              <Heart className="h-3 w-3" />
              Saved places
            </span>
            <h2 className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold">
              Favourites
            </h2>
          </div>
          <Link
            href="/search"
            className="link-editorial text-muted text-sm font-semibold hover:text-[rgb(var(--text))]"
          >
            Add new →
          </Link>
        </header>

        {loading ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {favorites.map((f) => {
              const place = sampleSuggestions.find((p) => p.id === f.placeId);
              const Icon = f.kind === 'home' ? Home : f.kind === 'work' ? Briefcase : MapPin;
              return (
                <li key={f.id}>
                  <div className="surface-elevated hover:shadow-card group flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5">
                    <span
                      className={cn(
                        'inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm',
                        f.kind === 'home'
                          ? 'from-brand-500 to-brand-700 bg-gradient-to-br'
                          : f.kind === 'work'
                            ? 'from-accent-400 to-accent-600 bg-gradient-to-br'
                            : 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display truncate text-sm font-bold tracking-tight">
                        {f.label ?? place?.name ?? f.placeId}
                      </div>
                      <div className="text-subtle font-mono text-[10px] uppercase tracking-[0.18em]">
                        {f.kind}
                        {place?.countryCode ? ` · ${place.countryCode}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFavorite(f.id)}
                      aria-label="Remove"
                      className="focus-ring text-subtle hover:text-status-severe inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[rgb(var(--surface-muted))]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---- Saved routes ------------------------------------------ */}
      <section>
        <header className="mb-4 flex items-end justify-between">
          <div>
            <span className="chip-brand">
              <Bookmark className="h-3 w-3" />
              Saved trips
            </span>
            <h2 className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold">
              Recent routes
            </h2>
          </div>
          <Link
            href="/plan"
            className="link-editorial text-muted text-sm font-semibold hover:text-[rgb(var(--text))]"
          >
            Plan a trip →
          </Link>
        </header>

        {loading ? (
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : routes.length === 0 ? (
          <EmptyRoutes />
        ) : (
          <ul className="grid gap-2">
            {routes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/plan?from=${encodeURIComponent(r.data?.from ?? '')}&to=${encodeURIComponent(r.data?.to ?? '')}`}
                  className="ticket focus-ring group flex items-center gap-4 p-4"
                >
                  <span className="from-brand-500 to-brand-700 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-105">
                    <Train className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display truncate text-base font-bold tracking-tight">
                      {r.label ?? `${r.data?.from ?? '?'} → ${r.data?.to ?? '?'}`}
                    </div>
                    {r.notifyOnDisruption && (
                      <span className="text-status-onTime mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em]">
                        <BellRing className="h-3 w-3" />
                        Notify on disruption
                      </span>
                    )}
                  </div>
                  <ArrowUpRight className="text-subtle h-4 w-4 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[rgb(var(--text))]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-subtle font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
        {label}
      </dt>
      <dd className="font-display mt-1 text-2xl font-bold tracking-tight">
        <span className="board-num">{value}</span>
      </dd>
    </div>
  );
}

function EmptyFavorites() {
  return (
    <div className="ticket relative overflow-hidden p-8 text-center">
      <Heart className="mx-auto h-7 w-7 text-rose-400" />
      <h3 className="font-display mt-3 text-lg font-bold tracking-tight">No favourites yet</h3>
      <p className="text-muted mt-1 text-sm">
        Save Home, Work, or any place to find it instantly later.
      </p>
      <Link href="/search" className="btn-primary mt-4 inline-flex">
        Add a place
      </Link>
    </div>
  );
}

function EmptyRoutes() {
  return (
    <div className="ticket relative overflow-hidden p-8 text-center">
      <Bookmark className="text-brand-500 mx-auto h-7 w-7" />
      <h3 className="font-display mt-3 text-lg font-bold tracking-tight">No saved trips</h3>
      <p className="text-muted mt-1 text-sm">
        Plan a trip and tap <span className="font-mono text-[12px]">Save</span> to add it here.
      </p>
      <Link href="/plan" className="btn-primary mt-4 inline-flex">
        Plan a trip
      </Link>
    </div>
  );
}
