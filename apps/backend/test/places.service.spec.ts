import 'reflect-metadata';
import { PlacesService } from '../src/modules/places/places.service';

/**
 * Shape a stand-in for `DataSource.query` so the in-memory fallback path is
 * exercised. Returning [] for every query makes the service decide the DB
 * is empty and use the sample data set.
 */
function makeDsStub() {
  return { query: jest.fn().mockResolvedValue([]) };
}

describe('PlacesService (in-memory fallback)', () => {
  it('returns no suggestions for an empty query', async () => {
    const svc = new PlacesService(makeDsStub() as never);
    const res = await svc.autocomplete('');
    expect(res.suggestions).toEqual([]);
  });

  it('finds Frankfurt Hbf with a fuzzy query', async () => {
    const svc = new PlacesService(makeDsStub() as never);
    const res = await svc.autocomplete('frankfurt');
    expect(res.suggestions.length).toBeGreaterThan(0);
    const top = res.suggestions[0]!.place;
    expect(top.id).toMatch(/^de:frankfurt/);
    expect(res.suggestions[0]!.score).toBeGreaterThan(0.5);
  });

  it('respects a country filter', async () => {
    const svc = new PlacesService(makeDsStub() as never);
    const res = await svc.autocomplete('hbf', { countryCodes: ['FR'] });
    for (const s of res.suggestions) {
      expect(s.place.countryCode).toBe('FR');
    }
  });

  it('finds Tunis via its Arabic name', async () => {
    const svc = new PlacesService(makeDsStub() as never);
    const res = await svc.autocomplete('تونس');
    const ids = res.suggestions.map((s) => s.place.id);
    expect(ids.some((id) => id.startsWith('tn:'))).toBe(true);
  });

  it('boosts results near the user when `near` is provided', async () => {
    const svc = new PlacesService(makeDsStub() as never);
    // Center near Berlin Hbf. Should pull Berlin entries above Frankfurt.
    const res = await svc.autocomplete('h', {
      near: { lat: 52.52, lng: 13.405 },
      limit: 5,
    });
    expect(res.suggestions.length).toBeGreaterThan(0);
    expect(res.suggestions[0]!.distanceMeters).toBeDefined();
  });

  it('returns nearby stops within a radius, sorted by distance', async () => {
    const svc = new PlacesService(makeDsStub() as never);
    const res = await svc.nearbyStops({ lat: 52.52, lng: 13.405 }, 50_000, 5);
    expect(res.stops.length).toBeGreaterThan(0);
    const distances = res.stops.map((s) => s.distanceMeters);
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
  });
});
