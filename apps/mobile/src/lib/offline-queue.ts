import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorage } from './storage';

export interface QueuedMutation {
  /** Stable id (uuid) — used for de-dup and idempotency. */
  id: string;
  path: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Auth-bearer required */
  auth?: boolean;
  attempts: number;
  enqueuedAt: number;
}

interface QueueState {
  items: QueuedMutation[];
  enqueue: (m: Omit<QueuedMutation, 'attempts' | 'enqueuedAt'>) => void;
  remove: (id: string) => void;
  incrementAttempt: (id: string) => void;
  reset: () => void;
}

/**
 * Offline mutation queue.
 *
 * Components that perform a write while online try the request first; on
 * failure they `enqueue()` it. A draining task (run from `_layout.tsx` on
 * focus / when reconnecting) walks the queue oldest-first and replays.
 *
 * Idempotency: callers should send the `Idempotency-Key` header equal to
 * `id` so the backend can dedupe in case the original call actually
 * succeeded but the response was lost.
 */
export const useOfflineQueue = create<QueueState>()(
  persist(
    (set) => ({
      items: [],
      enqueue: (m) =>
        set((s) => ({
          items: [...s.items, { ...m, attempts: 0, enqueuedAt: Date.now() }],
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
      incrementAttempt: (id) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, attempts: x.attempts + 1 } : x)),
        })),
      reset: () => set({ items: [] }),
    }),
    { name: 'wayra:offline-queue', storage: asyncStorage() },
  ),
);

export function newMutationId(): string {
  // Plain UUIDv4 without external dep.
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
