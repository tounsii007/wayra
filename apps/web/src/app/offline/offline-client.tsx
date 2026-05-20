'use client';

import { useEffect, useState } from 'react';
import {
  CloudDownload,
  Loader2,
  CheckCircle2,
  Trash2,
  RefreshCcw,
  HardDrive,
  MapPin,
} from 'lucide-react';
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
  progress: number;
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

  const totalDownloaded = Object.entries(local).reduce((sum, [id, st]) => {
    if (st.status !== 'done') return sum;
    const region = regions.find((r) => r.id === id);
    return sum + (region?.sizeBytes ?? 0);
  }, 0);
  const countDownloaded = Object.values(local).filter((s) => s.status === 'done').length;

  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="ticket text-status-severe overflow-hidden p-5 text-sm">
        Failed to load offline regions: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage summary */}
      <div className="ticket flex items-center gap-4 overflow-hidden p-5">
        <span className="from-brand-500 to-brand-700 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md">
          <HardDrive className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <div className="text-subtle font-mono text-[10px] uppercase tracking-[0.18em]">
            Downloaded
          </div>
          <div className="font-display text-xl font-bold tracking-tight">
            <span className="board-num">{countDownloaded}</span> region
            {countDownloaded === 1 ? '' : 's'} ·{' '}
            <span className="board-num">{humanSize(totalDownloaded)}</span>
          </div>
        </div>
      </div>

      {/* Region list */}
      <ul className="grid gap-3">
        {regions.map((r) => {
          const st = local[r.id];
          const stale = (daysSince(st?.downloadedAt) ?? 0) > 14;
          return (
            <li key={r.id} className="ticket relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <span className="from-brand-500 via-brand-700 to-accent-600 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md">
                    <CloudDownload className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-display text-lg font-bold tracking-tight">{r.name}</div>
                    <div className="text-subtle flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
                      <MapPin className="h-3 w-3" />
                      {r.countryCode} · {humanSize(r.sizeBytes)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {st?.status === 'done' && !stale && (
                    <span className="bg-status-onTime/15 text-status-onTime inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ready
                    </span>
                  )}
                  {stale && (
                    <span className="bg-status-delay/15 text-status-delay inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
                      <RefreshCcw className="h-3 w-3" />
                      Stale
                    </span>
                  )}
                  {!st && (
                    <button onClick={() => startDownload(r)} className="btn-primary text-xs">
                      <CloudDownload className="h-3.5 w-3.5" />
                      Download
                    </button>
                  )}
                  {st?.status === 'done' && (
                    <>
                      {stale && (
                        <button onClick={() => startDownload(r)} className="btn-surface text-xs">
                          Update
                        </button>
                      )}
                      <button
                        onClick={() => remove(r)}
                        aria-label="Remove offline data"
                        className="focus-ring text-subtle hover:text-status-severe inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgb(var(--surface-muted))]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {st?.status === 'downloading' && (
                    <span className="text-muted inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="board-num">{st.progress}%</span>
                    </span>
                  )}
                </div>
              </div>

              {st?.status === 'downloading' && (
                <div className="border-t border-[rgb(var(--border))] px-5 pb-3 pt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--surface-muted))]">
                    <div
                      className={cn(
                        'from-brand-500 to-accent-500 h-full bg-gradient-to-r transition-all',
                      )}
                      style={{ width: `${st.progress}%` }}
                    />
                  </div>
                </div>
              )}
              {st?.status === 'done' && (
                <p className="text-subtle border-t border-[rgb(var(--border))] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em]">
                  Downloaded {daysSince(st.downloadedAt)} day
                  {daysSince(st.downloadedAt) === 1 ? '' : 's'} ago · version{' '}
                  {new Date(r.version).toLocaleDateString()}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
