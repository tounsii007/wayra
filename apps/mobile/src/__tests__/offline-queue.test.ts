import { useOfflineQueue, newMutationId } from '../lib/offline-queue';

describe('newMutationId', () => {
  it('returns a v4-shaped UUID', () => {
    const id = newMutationId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns distinct ids on consecutive calls', () => {
    const a = newMutationId();
    const b = newMutationId();
    expect(a).not.toBe(b);
  });

  it('sets the version nibble to 4', () => {
    const id = newMutationId();
    expect(id.charAt(14)).toBe('4');
  });
});

describe('useOfflineQueue', () => {
  beforeEach(() => {
    useOfflineQueue.getState().reset();
  });

  it('starts with an empty items list', () => {
    expect(useOfflineQueue.getState().items).toEqual([]);
  });

  it('enqueues a mutation with attempts=0 and a timestamp', () => {
    const id = newMutationId();
    useOfflineQueue.getState().enqueue({
      id,
      path: '/api/me/recent',
      method: 'POST',
      body: { placeId: 'de:berlin:hbf' },
      auth: true,
    });
    const items = useOfflineQueue.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id,
      path: '/api/me/recent',
      method: 'POST',
      attempts: 0,
    });
    expect(items[0]!.enqueuedAt).toBeGreaterThan(0);
  });

  it('appends new mutations in order', () => {
    const id1 = newMutationId();
    const id2 = newMutationId();
    useOfflineQueue.getState().enqueue({ id: id1, path: '/a', method: 'POST' });
    useOfflineQueue.getState().enqueue({ id: id2, path: '/b', method: 'PUT' });
    const items = useOfflineQueue.getState().items;
    expect(items.map((i) => i.id)).toEqual([id1, id2]);
  });

  it('increments attempt count for a given id only', () => {
    const id1 = newMutationId();
    const id2 = newMutationId();
    const q = useOfflineQueue.getState();
    q.enqueue({ id: id1, path: '/a', method: 'POST' });
    q.enqueue({ id: id2, path: '/b', method: 'POST' });
    q.incrementAttempt(id1);
    q.incrementAttempt(id1);
    const items = useOfflineQueue.getState().items;
    expect(items.find((x) => x.id === id1)!.attempts).toBe(2);
    expect(items.find((x) => x.id === id2)!.attempts).toBe(0);
  });

  it('removes a mutation by id', () => {
    const id1 = newMutationId();
    const id2 = newMutationId();
    const q = useOfflineQueue.getState();
    q.enqueue({ id: id1, path: '/a', method: 'POST' });
    q.enqueue({ id: id2, path: '/b', method: 'POST' });
    q.remove(id1);
    const items = useOfflineQueue.getState().items;
    expect(items.map((i) => i.id)).toEqual([id2]);
  });

  it('reset() wipes all queued mutations', () => {
    const q = useOfflineQueue.getState();
    q.enqueue({ id: newMutationId(), path: '/a', method: 'POST' });
    q.enqueue({ id: newMutationId(), path: '/b', method: 'POST' });
    expect(useOfflineQueue.getState().items).toHaveLength(2);
    q.reset();
    expect(useOfflineQueue.getState().items).toEqual([]);
  });
});
