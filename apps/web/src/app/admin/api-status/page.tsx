'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Endpoint {
  name: string;
  url: string;
  state: 'pending' | 'ok' | 'fail';
  latencyMs?: number;
}

const initial: Endpoint[] = [
  { name: 'Health', url: '/api/health', state: 'pending' },
  { name: 'Search', url: '/api/search?q=Berlin', state: 'pending' },
  { name: 'Nearby stops', url: '/api/stops/nearby?lat=52.52&lng=13.4', state: 'pending' },
  { name: 'Disruptions', url: '/api/realtime/disruptions', state: 'pending' },
  { name: 'Offline regions', url: '/api/offline/regions', state: 'pending' },
];

export default function ApiStatusPage() {
  const [items, setItems] = useState<Endpoint[]>(initial);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    let cancelled = false;
    (async () => {
      const next: Endpoint[] = [];
      for (const ep of initial) {
        const started = performance.now();
        try {
          const res = await fetch(base + ep.url);
          next.push({
            ...ep,
            state: res.ok ? 'ok' : 'fail',
            latencyMs: Math.round(performance.now() - started),
          });
        } catch {
          next.push({ ...ep, state: 'fail' });
        }
        if (cancelled) return;
        setItems([...next, ...initial.slice(next.length)]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const okCount = items.filter((i) => i.state === 'ok').length;
  const failCount = items.filter((i) => i.state === 'fail').length;
  const avgLatency =
    items.filter((i) => i.latencyMs).reduce((s, i) => s + (i.latencyMs ?? 0), 0) /
      Math.max(1, items.filter((i) => i.latencyMs).length) || 0;

  return (
    <div className="space-y-8">
      <header>
        <span className="chip-brand">
          <Activity className="h-3 w-3" />
          Probes
        </span>
        <h1 className="font-display text-display-md tracking-tightest display-tight mt-3 font-bold">
          API status
        </h1>
        <p className="text-muted mt-2 max-w-xl text-pretty text-base">
          Live probe of backend endpoints. Re-runs on each page load and reports latency in
          milliseconds.
        </p>
      </header>

      {/* Summary tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="OK" value={String(okCount)} tone="ok" Icon={CheckCircle2} />
        <SummaryTile label="Fail" value={String(failCount)} tone="fail" Icon={AlertTriangle} />
        <SummaryTile
          label="Avg latency"
          value={avgLatency > 0 ? `${Math.round(avgLatency)} ms` : '—'}
          tone="brand"
          Icon={Zap}
        />
      </div>

      {/* Endpoint list */}
      <ul className="ticket grid divide-y divide-[rgb(var(--border))] overflow-hidden">
        {items.map((it) => (
          <li
            key={it.url}
            className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[rgb(var(--surface-muted))]"
          >
            <span
              className={cn(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                it.state === 'ok'
                  ? 'bg-status-onTime/15 text-status-onTime'
                  : it.state === 'fail'
                    ? 'bg-status-severe/15 text-status-severe'
                    : 'text-muted bg-[rgb(var(--surface-muted))]',
              )}
            >
              <Activity className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-bold tracking-tight">{it.name}</div>
              <div className="text-subtle truncate font-mono text-[11px]">{it.url}</div>
            </div>
            {it.state === 'ok' && (
              <span className="bg-status-onTime/15 text-status-onTime inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold">
                <CheckCircle2 className="h-3 w-3" />
                <span className="board-num">{it.latencyMs} ms</span>
              </span>
            )}
            {it.state === 'fail' && (
              <span className="bg-status-severe/15 text-status-severe inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold">
                <AlertTriangle className="h-3 w-3" />
                unreachable
              </span>
            )}
            {it.state === 'pending' && <div className="skeleton h-7 w-20 rounded-full" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  tone: 'ok' | 'fail' | 'brand';
  Icon: typeof Activity;
}) {
  return (
    <div className="surface-elevated relative isolate overflow-hidden rounded-3xl p-5">
      <span
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm',
          tone === 'ok' && 'bg-status-onTime',
          tone === 'fail' && 'bg-status-severe',
          tone === 'brand' && 'from-brand-500 to-brand-700 bg-gradient-to-br',
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="text-subtle mt-3 font-mono text-[10px] uppercase tracking-[0.18em]">
        {label}
      </div>
      <div className="board-num font-display tracking-tightest mt-1 text-3xl font-bold">
        {value}
      </div>
    </div>
  );
}
