import { describe, it, expect } from 'vitest';
import { Building2, Train, TramFront, Bus, Plane, MapPin } from 'lucide-react';
import { typeIconFor } from '../components/place-icon';

describe('typeIconFor', () => {
  it('returns Train for station', () => {
    expect(typeIconFor('station')).toBe(Train);
  });

  it('returns Train for metro_station', () => {
    expect(typeIconFor('metro_station')).toBe(Train);
  });

  it('returns Building2 for city', () => {
    expect(typeIconFor('city')).toBe(Building2);
  });

  it('returns TramFront for tram_stop', () => {
    expect(typeIconFor('tram_stop')).toBe(TramFront);
  });

  it('returns Bus for bus_stop', () => {
    expect(typeIconFor('bus_stop')).toBe(Bus);
  });

  it('returns Plane for airport', () => {
    expect(typeIconFor('airport')).toBe(Plane);
  });

  it('falls back to MapPin for poi', () => {
    expect(typeIconFor('poi')).toBe(MapPin);
  });

  it('falls back to MapPin for an unknown type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(typeIconFor('unknown_type' as any)).toBe(MapPin);
  });
});
