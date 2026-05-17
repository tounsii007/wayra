import 'reflect-metadata';
import { RoutesService } from '../src/modules/routes/routes.service';
import { PlacesService } from '../src/modules/places/places.service';

function makeDsStub() {
  return { query: jest.fn().mockResolvedValue([]) };
}

describe('RoutesService.plan', () => {
  const places = new PlacesService(makeDsStub() as never);
  const routes = new RoutesService(places);

  it('returns three preference-tagged candidates for a known pair', async () => {
    const res = await routes.plan({
      from: { placeId: 'de:frankfurt:hbf' },
      to: { placeId: 'de:berlin:hbf' },
    });
    expect(res.routes.length).toBe(3);
    const tags = res.routes.flatMap((r) => r.tags ?? []);
    expect(tags).toEqual(expect.arrayContaining(['fastest', 'cheapest', 'fewest_transfers']));
  });

  it('honors arriveBy by back-computing departure', async () => {
    const arriveBy = new Date(Date.now() + 6 * 3600_000).toISOString();
    const res = await routes.plan({
      from: { placeId: 'de:frankfurt:hbf' },
      to: { placeId: 'fr:paris:gare-de-lyon' },
      arriveBy,
    });
    expect(res.routes.length).toBeGreaterThan(0);
    const first = res.routes[0]!;
    // Departure must be strictly before the requested arrival.
    expect(new Date(first.departureTime).getTime()).toBeLessThan(new Date(arriveBy).getTime());
  });

  it('inflates duration and tags accessible when wheelchair=true', async () => {
    const r1 = await routes.plan({
      from: { placeId: 'de:frankfurt:hbf' },
      to: { placeId: 'de:berlin:hbf' },
    });
    const r2 = await routes.plan({
      from: { placeId: 'de:frankfurt:hbf' },
      to: { placeId: 'de:berlin:hbf' },
      wheelchair: true,
    });
    const fastest1 = r1.routes.find((r) => r.tags?.includes('fastest'))!;
    const fastest2 = r2.routes.find((r) => r.tags?.includes('fastest'))!;
    expect(fastest2.durationSeconds).toBeGreaterThan(fastest1.durationSeconds);
    expect(fastest2.tags).toContain('accessible');
  });

  it('produces a sensible CO2 saving vs car for a long-haul route', async () => {
    const res = await routes.plan({
      from: { placeId: 'de:frankfurt:hbf' },
      to: { placeId: 'fr:paris:gare-de-lyon' },
    });
    const fastest = res.routes.find((r) => r.tags?.includes('fastest'))!;
    expect(fastest.co2Grams).toBeGreaterThan(0);
    expect(fastest.co2SavedGrams).toBeGreaterThan(fastest.co2Grams);
  });

  it('returns a partial response when origin == destination', async () => {
    const res = await routes.plan({
      from: { placeId: 'de:frankfurt:hbf' },
      to: { placeId: 'de:frankfurt:hbf' },
    });
    expect(res.partial).toBe(true);
    expect(res.routes).toEqual([]);
  });

  it('caches routes so byId returns the same shape', async () => {
    const planned = await routes.plan({
      from: { placeId: 'de:frankfurt:hbf' },
      to: { placeId: 'de:berlin:hbf' },
    });
    const id = planned.routes[0]!.id;
    const fetched = routes.byId(id);
    expect(fetched.id).toBe(id);
  });
});
