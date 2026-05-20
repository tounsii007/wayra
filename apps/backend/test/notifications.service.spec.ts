import 'reflect-metadata';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import type { PushSubscriptionEntity } from '../src/database/entities';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** In-memory subscription repo that mirrors the slice of TypeORM Repository we use. */
function makeSubsRepo() {
  const rows: Array<Partial<PushSubscriptionEntity>> = [];
  return {
    rows,
    findOne: jest.fn(async ({ where }: { where: { endpoint: string } }) => {
      return rows.find((r) => r.endpoint === where.endpoint) ?? null;
    }),
    create: jest.fn((partial: Partial<PushSubscriptionEntity>) => ({
      id: `sub_${rows.length + 1}`,
      ...partial,
    })),
    save: jest.fn(async (row: Partial<PushSubscriptionEntity>) => {
      const i = rows.findIndex((r) => r.id === row.id || r.endpoint === row.endpoint);
      if (i >= 0) {
        rows[i] = { ...rows[i], ...row };
        return rows[i];
      }
      rows.push(row);
      return row;
    }),
    delete: jest.fn(async ({ endpoint }: { endpoint: string }) => {
      const i = rows.findIndex((r) => r.endpoint === endpoint);
      if (i >= 0) rows.splice(i, 1);
    }),
  };
}

/**
 * Minimal `DataSource` shim — `query(text, params)` returns whatever the test
 * stages on the underlying `queue` array.  Lets us test the SQL-driven
 * `notification_preference` upsert without standing up Postgres.
 */
function makeDsStub() {
  const queue: unknown[][] = [];
  return {
    queue,
    query: jest.fn(async () => queue.shift() ?? []),
  };
}

describe('NotificationsService.preferences', () => {
  it('returns DEFAULTS when no preference row exists', async () => {
    const ds = makeDsStub();
    const subs = makeSubsRepo();
    const svc = new NotificationsService(ds as any, subs as any);
    const prefs = await svc.getPreferences('user-1');
    expect(prefs.pushEnabled).toBe(true);
    expect(prefs.emailEnabled).toBe(false);
    expect(prefs.channels.delay).toBe(true);
    expect(prefs.channels.priceChange).toBe(false);
  });

  it('merges stored channels on top of defaults', async () => {
    const ds = makeDsStub();
    ds.queue.push([
      {
        push_enabled: false,
        email_enabled: true,
        channels: { delay: false, priceChange: true },
      },
    ]);
    const subs = makeSubsRepo();
    const svc = new NotificationsService(ds as any, subs as any);
    const prefs = await svc.getPreferences('user-1');
    expect(prefs.pushEnabled).toBe(false);
    expect(prefs.emailEnabled).toBe(true);
    expect(prefs.channels.delay).toBe(false); // overridden
    expect(prefs.channels.priceChange).toBe(true); // overridden
    expect(prefs.channels.cancellation).toBe(true); // default preserved
  });

  it('updatePreferences merges patch with the current row', async () => {
    const ds = makeDsStub();
    // First getPreferences() call inside updatePreferences → no row → DEFAULTS.
    ds.queue.push([]);
    // Second call is the UPSERT — returns []
    ds.queue.push([]);
    const svc = new NotificationsService(ds as any, makeSubsRepo() as any);
    const next = await svc.updatePreferences('user-1', {
      pushEnabled: false,
      channels: { delay: false },
    });
    expect(next.pushEnabled).toBe(false);
    expect(next.channels.delay).toBe(false);
    // The other channels keep their default values.
    expect(next.channels.cancellation).toBe(true);
  });
});

describe('NotificationsService.subscriptions', () => {
  it('creates a new web push subscription when none exists for the endpoint', async () => {
    const subs = makeSubsRepo();
    const svc = new NotificationsService(makeDsStub() as any, subs as any);
    const res = await svc.addWebPushSubscription('user-1', {
      endpoint: 'https://example.test/abc',
      p256dh: 'p',
      auth: 'a',
    });
    expect(res.id).toMatch(/^sub_/);
    expect(subs.rows).toHaveLength(1);
    expect(subs.rows[0]).toMatchObject({
      platform: 'web',
      endpoint: 'https://example.test/abc',
    });
  });

  it('updates the existing row when the endpoint is already known (dedup)', async () => {
    const subs = makeSubsRepo();
    subs.rows.push({
      id: 'sub_existing',
      endpoint: 'https://example.test/abc',
      platform: 'web',
      userId: null,
    });
    const svc = new NotificationsService(makeDsStub() as any, subs as any);
    const res = await svc.addWebPushSubscription('user-2', {
      endpoint: 'https://example.test/abc',
      p256dh: 'new-p',
      auth: 'new-a',
    });
    expect(res.id).toBe('sub_existing');
    expect(subs.rows).toHaveLength(1);
    expect(subs.rows[0]?.userId).toBe('user-2');
    expect(subs.rows[0]?.p256dh).toBe('new-p');
  });

  it('creates an Expo token subscription with the right platform', async () => {
    const subs = makeSubsRepo();
    const svc = new NotificationsService(makeDsStub() as any, subs as any);
    await svc.addExpoSubscription('user-1', { token: 'ExponentPushToken[xyz]', platform: 'ios' });
    expect(subs.rows).toHaveLength(1);
    expect(subs.rows[0]).toMatchObject({
      platform: 'ios',
      endpoint: 'ExponentPushToken[xyz]',
      expoToken: 'ExponentPushToken[xyz]',
    });
  });

  it('removeSubscription deletes by endpoint', async () => {
    const subs = makeSubsRepo();
    subs.rows.push({ id: 's1', endpoint: 'e1' }, { id: 's2', endpoint: 'e2' });
    const svc = new NotificationsService(makeDsStub() as any, subs as any);
    await svc.removeSubscription('e1');
    expect(subs.rows.map((r) => r.id)).toEqual(['s2']);
  });
});
