'use client';

import { useEffect, useState } from 'react';
import { CloudDownload, Loader2, CheckCircle2, Trash2, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Region {
  id: string;
  name: string;
  countryCode: string;
  sizeBytes: number;
  version: string;
  bbox: [number, number, number, number];
}

type Status = 'idle' | 'downloading' | 'done' | 'stale';
interface LocalState {
  status: Status;
  progress: number; // 0-100
  downloadedAt?: string;
}

const STORAGE_KEY = 'wayra-offline-state';

function loadLocal(): Record<string, LocalState> {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveLocal(state: Record<string, LocalState>) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

function daysSince(iso?: string): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function OfflineClient() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<Record<string, LocalState>>({});

  useEffect(() => {
    setLocal(loadLocal());
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    (async () => {
      try {
        const res = await fetch(`${base}/api/offline/regions`);
        const json = (await res.json()) as {
          data?: { regions: Region[] };
          error?: { message: string };
        };
        if (json.error) throw new Error(json.error.message);
        setRegions(json.data?.regions ?? []);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function startDownload(region: Region) {
    setLocal((s) => {
      const next = { ...s, [region.id]: { status: 'downloading' as Status, progress: 0 } };
      saveLocal(next);
      return next;
    });
    // Simulated progress — production: stream the bundle to IndexedDB / OPFS.
    let pct = 0;
    const timer = setInterval(() => {
      pct = Math.min(100, pct + Math.round(8 + Math.random() * 14));
      setLocal((s) => {
        const next = { ...s, [region.id]: { status: 'downloading' as Status, progress: pct } };
        saveLocal(next);
        return next;
      });
      if (pct >= 100) {
        clearInterval(timer);
        setLocal((s) => {
          const next = {
            ...s,
            [region.id]: {
              status: 'done' as Status,
              progress: 100,
              downloadedAt: new Date().toISOString(),
            },
          };
          saveLocal(next);
          return next;
        });
      }
    }, 220);
  }

  function remove(region: Region) {
    setLocal((s) => {
      const next = { ...s };
      delete next[region.id];
      saveLocal(next);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="surface text-status-severe rounded-2xl p-4 text-sm">
        Failed to load: {error}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {regions.map((r) => {
        const st = local[r.id];
        const stale = (daysSince(st?.downloadedAt) ?? 0) > 14;
        return (
          <li key={r.id} className="surface relative overflow-hidden rounded-2xl p-4">
            <header className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="from-brand-500 to-accent-violet shadow-glow inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white">
                  <CloudDownload className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-base font-bold">{r.name}</div>
                  <div className="text-subtle text-xs">
                    {r.countryCode} · {humanSize(r.sizeBytes)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {st?.status === 'done' && !stale && (
                  <span className="text-status-onTime inline-flex items-center gap-1 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    downloaded
                  </span>
                )}
                {stale && (
                  <span className="bg-status-delay/15 text-status-delay inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                    <RefreshCcw className="h-3 w-3" /> stale
                  </span>
                )}
                {!st && (
                  <button
                    onClick={() => startDownload(r)}
                    className="bg-brand-500 shadow-glow focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <CloudDownload className="h-3.5 w-3.5" /> download
                  </button>
                )}
                {st?.status === 'done' && (
                  <>
                    {stale && (
                      <button
                        onClick={() => startDownload(r)}
                        className="surface-muted focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                      >
                        update
                      </button>
                    )}
                    <button
                      onClick={() => remove(r)}
                      aria-label="Remove offline data"
                      className="text-subtle focus-ring rounded-full p-1.5 hover:bg-[rgb(var(--surface-muted))]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                {st?.status === 'downloading' && (
                  <span className="text-muted inline-flex items-center gap-1.5 text-xs font-semibold">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {st.progress}%
                  </span>
                )}
              </div>
            </header>

            {st?.status === 'downloading' && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--surface-muted))]">
                <div
                  className={cn('bg-brand-500 h-full transition-all')}
                  style={{ width: `${st.progress}%` }}
                />
              </div>
            )}
            {st?.status === 'done' && (
              <p className="text-subtle mt-2 text-xs">
                Downloaded {daysSince(st.downloadedAt)} day(s) ago — version{' '}
                {new Date(r.version).toLocaleDateString()}.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
