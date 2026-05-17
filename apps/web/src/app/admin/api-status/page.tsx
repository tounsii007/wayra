'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">API status</h1>
        <p className="text-sm text-muted">Live probe of backend endpoints. Re-runs on each page load.</p>
      </header>

      <ul className="surface divide-y divide-[rgb(var(--border))] overflow-hidden rounded-2xl">
        {items.map((it) => (
          <li key={it.url} className="flex items-center gap-3 px-4 py-3">
            <Activity className="h-4 w-4 text-subtle" />
            <div className="flex-1">
              <div className="text-sm font-semibold">{it.name}</div>
              <div className="font-mono text-xs text-subtle">{it.url}</div>
            </div>
            {it.state === 'ok' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-onTime">
                <CheckCircle2 className="h-3.5 w-3.5" /> {it.latencyMs} ms
              </span>
            )}
            {it.state === 'fail' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-severe">
                <AlertTriangle className="h-3.5 w-3.5" /> unreachable
              </span>
            )}
            {it.state === 'pending' && <div className="skeleton h-4 w-16 rounded-full" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
