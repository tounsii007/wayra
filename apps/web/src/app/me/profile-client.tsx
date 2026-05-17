'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, LogOut, Trash2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { sampleSuggestions } from '@/data/sample-suggestions';

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
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet text-lg font-bold text-white shadow-glow">
            {(user.displayName ?? user.email ?? '?').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-bold">{user.displayName ?? 'Traveler'}</div>
            <div className="text-xs text-subtle">{user.email}</div>
          </div>
        </div>
        <button
          onClick={() => {
            clear();
            router.replace('/');
          }}
          className="inline-flex items-center gap-1.5 rounded-full surface px-3 py-2 text-xs font-semibold focus-ring"
        >
          <LogOut className="h-3.5 w-3.5" /> Log out
        </button>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Favorites</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-2xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <ul className="surface divide-y divide-[rgb(var(--border))] overflow-hidden rounded-2xl">
            {favorites.map((f) => {
              const place = sampleSuggestions.find((p) => p.id === f.placeId);
              return (
                <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <Heart className="h-4 w-4 text-status-severe" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{f.label ?? place?.name ?? f.placeId}</div>
                    <div className="text-xs text-subtle uppercase tracking-wide">{f.kind}</div>
                  </div>
                  <button
                    onClick={() => removeFavorite(f.id)}
                    aria-label="Remove"
                    className="rounded-full p-1.5 text-subtle hover:bg-[rgb(var(--surface-muted))] focus-ring"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Saved routes</h2>
        {loading ? (
          <div className="skeleton h-14 rounded-2xl" />
        ) : routes.length === 0 ? (
          <EmptyRoutes />
        ) : (
          <ul className="surface divide-y divide-[rgb(var(--border))] overflow-hidden rounded-2xl">
            {routes.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <Sparkles className="h-4 w-4 text-brand-500" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    {r.label ?? `${r.data?.from} → ${r.data?.to}`}
                  </div>
                  {r.notifyOnDisruption && (
                    <div className="text-xs text-status-onTime">Notify on disruption</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyFavorites() {
  return (
    <div className="surface rounded-2xl p-6 text-center text-sm text-muted">
      No favorites yet. Save Home, Work, or any place to find it quickly.
    </div>
  );
}

function EmptyRoutes() {
  return (
    <div className="surface rounded-2xl p-6 text-center text-sm text-muted">
      No saved routes yet. Plan a trip and tap save to add it here.
    </div>
  );
}
