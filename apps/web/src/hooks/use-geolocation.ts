'use client';

import { useState } from 'react';
import type { Coordinates } from '@wayra/types';

export type GeolocationState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'ok'; coords: Coordinates }
  | { status: 'denied' }
  | { status: 'error'; message: string };

/**
 * Lightweight geolocation hook. Imperative, on demand — the caller
 * triggers the request, the browser shows the native permission prompt.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' });

  async function request(): Promise<Coordinates | null> {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setState({ status: 'error', message: 'Geolocation is not supported.' });
      return null;
    }
    setState({ status: 'requesting' });
    return new Promise<Coordinates | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setState({ status: 'ok', coords });
          resolve(coords);
        },
        (err) => {
          if (err.code === 1) setState({ status: 'denied' });
          else setState({ status: 'error', message: err.message });
          resolve(null);
        },
        { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
      );
    });
  }

  return { state, request };
}
