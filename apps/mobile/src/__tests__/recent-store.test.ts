import type { Place } from '@wayra/types';
import { useRecentStore } from '../lib/recent-store';

function makePlace(id: string, name: string): Place {
  return {
    id,
    type: 'station',
    name,
    coordinates: { lat: 0, lng: 0 },
    countryCode: 'DE',
    modes: ['rail'],
  };
}

describe('useRecentStore', () => {
  beforeEach(() => {
    useRecentStore.getState().clear();
  });

  it('starts with an empty list', () => {
    expect(useRecentStore.getState().recents).toEqual([]);
  });

  it('pushes a place to the front of the list', () => {
    const p = makePlace('de:berlin:hbf', 'Berlin Hbf');
    useRecentStore.getState().push(p);
    const recents = useRecentStore.getState().recents;
    expect(recents).toHaveLength(1);
    expect(recents[0]?.id).toBe('de:berlin:hbf');
  });

  it('moves a duplicate to the front without growing the list', () => {
    const a = makePlace('de:berlin:hbf', 'Berlin Hbf');
    const b = makePlace('de:frankfurt:hbf', 'Frankfurt Hbf');
    const store = useRecentStore.getState();
    store.push(a);
    store.push(b);
    store.push(a); // push existing again
    const recents = useRecentStore.getState().recents;
    expect(recents.map((r) => r.id)).toEqual(['de:berlin:hbf', 'de:frankfurt:hbf']);
  });

  it('keeps newest items at the front', () => {
    const a = makePlace('a', 'A');
    const b = makePlace('b', 'B');
    const c = makePlace('c', 'C');
    const store = useRecentStore.getState();
    store.push(a);
    store.push(b);
    store.push(c);
    expect(useRecentStore.getState().recents.map((r) => r.id)).toEqual(['c', 'b', 'a']);
  });

  it('caps the list at the MAX size (8) and drops the oldest', () => {
    const store = useRecentStore.getState();
    for (let i = 0; i < 12; i++) {
      store.push(makePlace(`p${i}`, `Place ${i}`));
    }
    const recents = useRecentStore.getState().recents;
    expect(recents).toHaveLength(8);
    expect(recents[0]?.id).toBe('p11');
    // p0..p3 should have been dropped.
    expect(recents.map((r) => r.id)).not.toContain('p0');
  });

  it('clear() empties the list', () => {
    const store = useRecentStore.getState();
    store.push(makePlace('a', 'A'));
    store.push(makePlace('b', 'B'));
    expect(useRecentStore.getState().recents).toHaveLength(2);
    store.clear();
    expect(useRecentStore.getState().recents).toEqual([]);
  });
});
