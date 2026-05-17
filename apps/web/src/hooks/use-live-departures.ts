'use client';

import { useEffect, useRef, useState } from 'react';
import type { Departure } from '@wayra/types';

/**
 * Subscribe to live departures for a stop.
 *
 * 1. Initial fetch via REST (`/api/realtime/departures`)
 * 2. Open a WebSocket on `/live`, subscribe to `stopId`
 * 3. Patch the local list whenever the server pushes `departure:update`
 *
 * If the WebSocket is unreachable (dev fallback) the hook still works on
 * the REST snapshot — the UI just won't auto-refresh.
 */
export function useLiveDepartures(stopId: string | undefined) {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [liveDataAvailable, setLiveDataAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!stopId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/realtime/departures?stopId=${encodeURIComponent(stopId)}&limit=12`,
          { signal: ctrl.signal },
        );
        const payload = (await res.json()) as {
          data?: { departures: Departure[]; liveDataAvailable: boolean };
          error?: { message: string };
        };
        if (payload.error) throw new Error(payload.error.message);
        setDepartures(payload.data?.departures ?? []);
        setLiveDataAvailable(payload.data?.liveDataAvailable ?? false);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();

    // WS subscription
    try {
      const wsUrl = apiUrl.replace(/^http/, 'ws') + '/live';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ event: 'subscribe', data: { stopIds: [stopId] } }));
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as { event?: string; data?: Departure };
          if (msg.event === 'departure:update' && msg.data) {
            setDepartures((prev) => {
              const i = prev.findIndex((d) => d.tripId === msg.data!.tripId);
              if (i === -1) return [...prev, msg.data!].slice(0, 24);
              const next = prev.slice();
              next[i] = msg.data!;
              return next;
            });
          }
        } catch {
          /* ignore malformed frames */
        }
      };
    } catch {
      // WS unreachable — REST snapshot is still good.
    }

    return () => {
      ctrl.abort();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [stopId]);

  return { departures, liveDataAvailable, loading, error };
}
