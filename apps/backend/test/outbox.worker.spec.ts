import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { OutboxWorker } from '../src/modules/notifications/outbox.worker';
import type { NotificationOutboxEntity } from '../src/database/entities';

/* eslint-disable @typescript-eslint/no-explicit-any */

function makeRow(overrides: Partial<NotificationOutboxEntity>): NotificationOutboxEntity {
  return {
    id: 'outbox_1',
    userId: 'user_1',
    payload: { title: 'Hi', body: 'There' },
    attempts: 0,
    nextAttemptAt: new Date(0),
    sentAt: null,
    lastError: null,
    createdAt: new Date(),
    ...overrides,
  } as NotificationOutboxEntity;
}

function makeOutboxRepo(initial: NotificationOutboxEntity[] = []) {
  const rows = [...initial];
  return {
    rows,
    find: jest.fn(async () => rows.filter((r) => !r.sentAt)),
    save: jest.fn(async (row: NotificationOutboxEntity) => {
      const i = rows.findIndex((r) => r.id === row.id);
      if (i >= 0) rows[i] = row;
      else rows.push(row);
      return row;
    }),
  };
}

function makeSender(result: { sent: number; failed: number } = { sent: 1, failed: 0 }) {
  return {
    sendToUser: jest.fn(async () => result),
  };
}

function configStub(values: Record<string, string> = {}): ConfigService {
  return { get: (k: string) => values[k] } as unknown as ConfigService;
}

describe('OutboxWorker.drain', () => {
  it('marks a row sent when the sender delivers ≥1 subscription', async () => {
    const row = makeRow({ id: 'a' });
    const outbox = makeOutboxRepo([row]);
    const sender = makeSender({ sent: 2, failed: 0 });
    const worker = new OutboxWorker(
      configStub({ NOTIFICATION_OUTBOX_ENABLED: 'false' }),
      outbox as any,
      sender as any,
    );

    await (worker as any).drain();
    expect(sender.sendToUser).toHaveBeenCalledTimes(1);
    expect(outbox.rows[0]?.sentAt).toBeInstanceOf(Date);
    expect(outbox.rows[0]?.lastError).toBeNull();
  });

  it('increments attempts and sets back-off when delivery returns 0 sent', async () => {
    const row = makeRow({ id: 'b', attempts: 0 });
    const outbox = makeOutboxRepo([row]);
    const sender = makeSender({ sent: 0, failed: 0 });
    const worker = new OutboxWorker(configStub(), outbox as any, sender as any);

    await (worker as any).drain();
    expect(outbox.rows[0]?.attempts).toBe(1);
    expect(outbox.rows[0]?.sentAt).toBeNull();
    expect(outbox.rows[0]?.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
    expect(outbox.rows[0]?.lastError).toMatch(/0 subs/);
  });

  it('records the sender exception and schedules a retry', async () => {
    const row = makeRow({ id: 'c' });
    const outbox = makeOutboxRepo([row]);
    const sender = {
      sendToUser: jest.fn(async () => {
        throw new Error('expo_unreachable');
      }),
    };
    const worker = new OutboxWorker(configStub(), outbox as any, sender as any);

    await (worker as any).drain();
    expect(outbox.rows[0]?.attempts).toBe(1);
    expect(outbox.rows[0]?.lastError).toBe('expo_unreachable');
    expect(outbox.rows[0]?.sentAt).toBeNull();
  });

  it('gives up after 8 attempts and writes attempts_exhausted', async () => {
    const row = makeRow({ id: 'd', attempts: 8 });
    const outbox = makeOutboxRepo([row]);
    const sender = makeSender();
    const worker = new OutboxWorker(configStub(), outbox as any, sender as any);

    await (worker as any).drain();
    expect(sender.sendToUser).not.toHaveBeenCalled();
    expect(outbox.rows[0]?.lastError).toBe('attempts_exhausted');
    expect(outbox.rows[0]?.sentAt).toBeInstanceOf(Date);
  });

  it('drops rows without a user_id with a clear error', async () => {
    const row = makeRow({ id: 'e', userId: null as unknown as string });
    const outbox = makeOutboxRepo([row]);
    const sender = makeSender();
    const worker = new OutboxWorker(configStub(), outbox as any, sender as any);

    await (worker as any).drain();
    expect(sender.sendToUser).not.toHaveBeenCalled();
    expect(outbox.rows[0]?.lastError).toBe('no_user_id');
    expect(outbox.rows[0]?.sentAt).toBeInstanceOf(Date);
  });

  it('drops rows with an invalid payload shape', async () => {
    const row = makeRow({ id: 'f', payload: { foo: 'bar' } as any });
    const outbox = makeOutboxRepo([row]);
    const sender = makeSender();
    const worker = new OutboxWorker(configStub(), outbox as any, sender as any);

    await (worker as any).drain();
    expect(sender.sendToUser).not.toHaveBeenCalled();
    expect(outbox.rows[0]?.lastError).toBe('invalid_payload');
    expect(outbox.rows[0]?.sentAt).toBeInstanceOf(Date);
  });

  it('processes multiple rows in one drain call', async () => {
    const a = makeRow({ id: 'g1' });
    const b = makeRow({ id: 'g2' });
    const outbox = makeOutboxRepo([a, b]);
    const sender = makeSender();
    const worker = new OutboxWorker(configStub(), outbox as any, sender as any);

    await (worker as any).drain();
    expect(sender.sendToUser).toHaveBeenCalledTimes(2);
    expect(outbox.rows.every((r) => r.sentAt)).toBe(true);
  });
});

describe('OutboxWorker.backoff', () => {
  it('grows exponentially capped at 3 hours', () => {
    const worker = new OutboxWorker(configStub(), {} as any, {} as any);
    // 5s * 3^(n-1) for n in 1..8, capped at 3h.
    expect((worker as any).backoff(1)).toBe(5_000);
    expect((worker as any).backoff(2)).toBe(15_000);
    expect((worker as any).backoff(3)).toBe(45_000);
    expect((worker as any).backoff(8)).toBeLessThanOrEqual(3 * 3600_000);
    expect((worker as any).backoff(20)).toBe(3 * 3600_000);
  });
});
