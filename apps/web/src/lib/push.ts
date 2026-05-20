/**
 * Web Push subscription helper.
 *
 *   subscribePush(token, vapidPublicKey)  → requests permission, registers
 *     the service worker if needed, calls pushManager.subscribe, and
 *     POSTs the resulting subscription to /api/me/notifications/subscriptions/web.
 *
 * Returns:
 *   - 'subscribed'    success path
 *   - 'denied'        user said no in the browser prompt
 *   - 'unsupported'   notifications/serviceWorker not available
 *   - 'error:<msg>'   the server returned non-2xx
 */
export type SubscribeResult = 'subscribed' | 'denied' | 'unsupported' | `error:${string}`;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribePush(
  bearer: string | null,
  vapidPublicKey: string | undefined,
): Promise<SubscribeResult> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('Notification' in window)
  ) {
    return 'unsupported';
  }
  if (!vapidPublicKey) return 'unsupported';

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';

  const reg =
    (await navigator.serviceWorker.getRegistration()) ??
    (await navigator.serviceWorker.register('/sw.js'));
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    // PushManager.subscribe expects BufferSource — pass the underlying
    // ArrayBuffer so TS lib.dom doesn't trip over the Uint8Array ↔
    // ArrayBufferView<ArrayBuffer> mismatch introduced in TS 5.7.
    const keyBuf = urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer;
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBuf,
    });
  }

  const subJson = sub.toJSON();
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/api/me/notifications/subscriptions/web`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      }),
    });
    if (!res.ok) return `error:http_${res.status}`;
    return 'subscribed';
  } catch (e) {
    return `error:${(e as Error).message}`;
  }
}

export async function unsubscribePush(bearer: string | null): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return false;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  await fetch(`${base}/api/me/notifications/subscriptions`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify({ endpoint }),
  }).catch(() => undefined);
  return true;
}
