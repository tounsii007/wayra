'use client';

import { useTranslations } from 'next-intl';
import { Activity, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

interface Item {
  city: string;
  status: 'ok' | 'minor' | 'major';
  note: string;
}

const sample: Item[] = [
  { city: 'Berlin', status: 'ok', note: 'S-Bahn pünktlich' },
  { city: 'Paris', status: 'minor', note: 'Ligne 4 — micro-perturbation' },
  { city: 'Frankfurt', status: 'ok', note: 'U-Bahn nach Plan' },
  { city: 'Tunis', status: 'minor', note: 'Métro 1 — léger retard' },
  { city: 'Hamburg', status: 'major', note: 'Streik bei der S-Bahn' },
  { city: 'Lyon', status: 'ok', note: 'TCL — trafic normal' },
];

const tone: Record<Item['status'], { dot: string; ring: string; label: string }> = {
  ok: { dot: 'bg-status-onTime', ring: 'ring-status-onTime/30', label: 'OK' },
  minor: { dot: 'bg-status-delay', ring: 'ring-status-delay/30', label: '!' },
  major: { dot: 'bg-status-severe', ring: 'ring-status-severe/30', label: '!!' },
};

export function LiveStatusBanner() {
  const t = useTranslations('home.sections');
  return (
    <section aria-labelledby="live-status-title">
      <div className="mb-4 flex items-end justify-between">
        <h2 id="live-status-title" className="inline-flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-5 w-5 text-status-onTime" />
          {t('liveStatus')}
        </h2>
        <span className="text-xs text-subtle inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          live
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sample.map((it) => {
          const Icon =
            it.status === 'major' ? AlertTriangle : it.status === 'minor' ? AlertTriangle : CheckCircle2;
          return (
            <li
              key={it.city}
              className="flex items-center gap-3 rounded-xl surface px-4 py-3"
            >
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${tone[it.status].dot} ring-4 ${tone[it.status].ring}`}
              >
                {it.status === 'ok' && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-status-onTime/40" />
                )}
              </span>
              <Icon className={`h-4 w-4 shrink-0 ${
                it.status === 'major' ? 'text-status-severe' : it.status === 'minor' ? 'text-status-delay' : 'text-status-onTime'
              }`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{it.city}</div>
                <div className="truncate text-xs text-muted">{it.note}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
