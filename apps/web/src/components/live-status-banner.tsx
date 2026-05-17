'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DemoBadge } from './demo-badge';

interface StatusItem {
  city: string;
  country: 'DE' | 'FR' | 'TN';
  status: 'ok' | 'minor' | 'major';
  note: string;
  locale: string;
}

const tone: Record<StatusItem['status'], { dot: string; ring: string }> = {
  ok: { dot: 'bg-status-onTime', ring: 'ring-status-onTime/30' },
  minor: { dot: 'bg-status-delay', ring: 'ring-status-delay/30' },
  major: { dot: 'bg-status-severe', ring: 'ring-status-severe/30' },
};

const FALLBACK: StatusItem[] = [
  { city: 'Berlin', country: 'DE', status: 'ok', note: 'S-Bahn pünktlich', locale: 'de' },
  { city: 'Paris', country: 'FR', status: 'minor', note: 'Ligne 4 — perturbations', locale: 'fr' },
  { city: 'Tunis', country: 'TN', status: 'minor', note: 'Métro 1 ralentie', locale: 'fr' },
];

export function LiveStatusBanner() {
  const t = useTranslations('home.sections');
  const [items, setItems] = useState<StatusItem[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${base}/api/realtime/network-status`, { signal: ctrl.signal });
        const json = (await res.json()) as {
          data?: { items: StatusItem[]; generatedAt: string };
          error?: { message: string };
        };
        if (json.error) throw new Error(json.error.message);
        setItems(json.data?.items ?? []);
        setGeneratedAt(json.data?.generatedAt ?? null);
        setUsedFallback(false);
      } catch {
        setItems(FALLBACK);
        setUsedFallback(true);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const display = items.length > 0 ? items.slice(0, 6) : FALLBACK;

  return (
    <section aria-labelledby="live-status-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 id="live-status-title" className="inline-flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-5 w-5 text-status-onTime" />
          {t('liveStatus')}
        </h2>
        <div className="flex items-center gap-2">
          <DemoBadge />
          {generatedAt && (
            <span className="text-xs text-subtle">
              · updated {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {usedFallback && <span className="text-xs text-status-delay">offline preview</span>}
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {display.map((it) => {
          const Icon = it.status === 'ok' ? CheckCircle2 : AlertTriangle;
          return (
            <li
              key={`${it.country}-${it.city}`}
              className="flex items-center gap-3 rounded-xl surface px-4 py-3"
            >
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${tone[it.status].dot} ring-4 ${tone[it.status].ring}`}
              >
                {it.status === 'ok' && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-status-onTime/40" />
                )}
              </span>
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  it.status === 'major'
                    ? 'text-status-severe'
                    : it.status === 'minor'
                      ? 'text-status-delay'
                      : 'text-status-onTime'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-semibold">{it.city}</span>
                  <span className="text-[10px] font-bold uppercase text-subtle">{it.country}</span>
                </div>
                <div className="truncate text-xs text-muted">{it.note}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
