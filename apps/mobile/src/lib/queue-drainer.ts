import { useOfflineQueue } from './offline-queue';
import { useAuthStore } from './auth-store';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Walks the offline mutation queue and replays each entry. Returns the
 * number of successful drains. Backoff is exponential per-item via
 * attempts counter — items with too many attempts get dropped after 8.
 */
export async function drainQueue(): Promise<number> {
  const { items, remove, incrementAttempt } = useOfflineQueue.getState();
  if (items.length === 0) return 0;
  const token = useAuthStore.getState().token;
  let sent = 0;

  for (const item of items) {
    if (item.attempts >= 8) {
      remove(item.id);
      continue;
    }
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'idempotency-key': item.id,
    };
    if (item.auth && token) headers.authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`${BASE}${item.path}`, {
        method: item.method,
        headers,
        body: item.body !== undefined ? JSON.stringify(item.body) : undefined,
      });
      if (
        res.ok ||
        (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429)
      ) {
        // Success OR a permanent client error → drop. Retrying a 400/403 won't help.
        remove(item.id);
        if (res.ok) sent++;
      } else {
        incrementAttempt(item.id);
      }
    } catch {
      incrementAttempt(item.id);
      // Network error → abort the drain; rest stays queued.
      break;
    }
  }
  return sent;
}
