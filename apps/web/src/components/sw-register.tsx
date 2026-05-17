'use client';

import { useEffect } from 'react';

/**
 * Registers the Wayra service worker on production builds.
 * Skipped in development so it doesn't interfere with HMR.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const reg = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (e) {
        console.warn('[wayra] service worker registration failed:', e);
      }
    };

    if (document.readyState === 'complete') reg();
    else window.addEventListener('load', reg, { once: true });
  }, []);

  return null;
}
