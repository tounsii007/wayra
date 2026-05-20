'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';

interface State {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Web-Push subscription manager.
 *
 * Subscribes the active service-worker to PushManager using the VAPID
 * key from NEXT_PUBLIC_VAPID_PUBLIC_KEY (env), then registers the
 * subscription endpoint with /api/me/notifications/subscriptions/web.
 *
 * When the key isn't set, `subscribe()` resolves false and surfaces an
 * "unsupported" state so the UI can show a friendly message.
 */
export function usePushSubscription() {
  const [state, setState] = useState<State>({
    supported: false,
    permission: 'default',
    subscribed: false,
  });
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator)
    ) {
      setState({ supported: false, permission: 'unsupported', subscribed: false });
      return;
    }
    let cancelled = false;
    (async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (cancelled) return;
      setState({ supported: true, permission: Notification.permission, subscribed: !!sub });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.supported) return false;
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) return false;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      setState((s) => ({ ...s, permission: perm }));
      return false;
    }
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const subscription =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid).buffer as ArrayBuffer,
      }));
    const payload = subscription.toJSON();
    if (token) {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      await fetch(`${base}/api/me/notifications/subscriptions/web`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          endpoint: payload.endpoint,
          p256dh: payload.keys?.p256dh,
          auth: payload.keys?.auth,
        }),
      });
    }
    setState({ supported: true, permission: 'granted', subscribed: true });
    return true;
  }, [state.supported, token]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!state.supported) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    if (token) {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      await fetch(`${base}/api/me/notifications/subscriptions`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint }),
      });
    }
    setState((s) => ({ ...s, subscribed: false }));
  }, [state.supported, token]);

  return { ...state, subscribe, unsubscribe };
}
