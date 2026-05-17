import { useEffect, useRef, useState } from 'react';
import type { Departure } from '@wayra/types';
import { api } from '@/lib/api';

/**
 * Mobile equivalent of the web hook: REST snapshot + best-effort
 * Socket.IO subscription. Gracefully degrades when WS isn't reachable.
 */
export function useLiveDepartures(stopId: string | undefined) {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [stopName, setStopName] = useState<string | null>(null);
  const [liveDataAvailable, setLiveDataAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!stopId) return;
    setLoading(true);
    setError(null);
    let cancelled = false;

    (async () => {
      try {
        const res = await api.departures(stopId, 12);
        if (cancelled) return;
        setDepartures(res.departures);
        setStopName(res.stop.name ?? null);
        setLiveDataAvailable(res.liveDataAvailable);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    try {
      const url = api.baseUrl.replace(/^http/, 'ws') + '/live';
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () =>
        ws.send(JSON.stringify({ event: 'subscribe', data: { stopIds: [stopId] } }));
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
          /* ignore */
        }
      };
    } catch {
      /* WS optional */
    }

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [stopId]);

  return { departures, stopName, liveDataAvailable, loading, error };
}
