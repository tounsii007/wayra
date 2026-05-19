import { useState } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '@wayra/types';

export type GeoState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'ok'; coords: Coordinates }
  | { status: 'denied' }
  | { status: 'error'; message: string };

/**
 * Imperative geolocation hook using expo-location. Returns the coords
 * (and updates state) so callers can chain into navigation.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' });

  async function request(): Promise<Coordinates | null> {
    setState({ status: 'requesting' });
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setState({ status: 'denied' });
      return null;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setState({ status: 'ok', coords });
      return coords;
    } catch (e) {
      setState({ status: 'error', message: (e as Error).message });
      return null;
    }
  }

  return { state, request };
}
