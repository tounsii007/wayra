import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { RealtimeGateway } from './realtime.gateway';
import type { Departure } from '@wayra/types';

const { FeedMessage } = GtfsRealtimeBindings.transit_realtime;

interface FeedSource {
  id: string;
  url: string;
  country: string;
  headers?: Record<string, string>;
  feedPrefix: string;
}

/**
 * GTFS-Realtime polling worker.
 *
 * Polls every configured feed every 30 s, decodes the protobuf
 * payload, persists deltas into `realtime_update` and `disruption`,
 * and emits `departure:update` to Socket.IO rooms.
 *
 * Disabled by default; set GTFS_RT_ENABLED=true to start it.
 */
@Injectable()
export class GtfsRtWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GtfsRtWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly sources: FeedSource[];
  private readonly enabled: boolean;
  private readonly intervalMs: number;

  constructor(
    config: ConfigService,
    private readonly gateway: RealtimeGateway,
    @InjectDataSource() private readonly ds: DataSource,
  ) {
    this.enabled = config.get<string>('GTFS_RT_ENABLED') === 'true';
    this.intervalMs = Number(config.get<string>('GTFS_RT_INTERVAL_MS') ?? '30000');
    this.sources = [
      {
        id: 'db',
        feedPrefix: 'db',
        country: 'DE',
        url: config.get<string>('GTFS_RT_DB_URL') ?? '',
      },
      {
        id: 'sncf',
        feedPrefix: 'sncf',
        country: 'FR',
        url: config.get<string>('GTFS_RT_SNCF_URL') ?? '',
      },
      {
        id: 'idfm',
        feedPrefix: 'idfm',
        country: 'FR',
        url: config.get<string>('GTFS_RT_IDFM_URL') ?? '',
      },
    ].filter((s) => Boolean(s.url));
  }

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log('GTFS-RT worker disabled (set GTFS_RT_ENABLED=true to enable).');
      return;
    }
    this.logger.log(`GTFS-RT worker starting — ${this.sources.length} feed(s).`);
    this.timer = setInterval(() => this.tick().catch((e) => this.logger.error(e)), this.intervalMs);
    setImmediate(() => this.tick().catch((e) => this.logger.error(e)));
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    for (const src of this.sources) {
      try {
        const res = await fetch(src.url, { headers: src.headers });
        if (!res.ok) {
          this.logger.warn(`feed ${src.id} responded ${res.status}`);
          continue;
        }
        const buffer = new Uint8Array(await res.arrayBuffer());
        const feed = FeedMessage.decode(buffer);
        await this.handleFeed(src, feed);
        this.logger.debug(`feed ${src.id}: ${feed.entity.length} entities`);
      } catch (e) {
        this.logger.warn(`feed ${src.id} failed: ${(e as Error).message}`);
      }
    }
  }

  private async handleFeed(
    src: FeedSource,
    feed: GtfsRealtimeBindings.transit_realtime.IFeedMessage,
  ): Promise<void> {
    for (const entity of feed.entity ?? []) {
      // Trip updates → realtime_update rows + Socket.IO push per stop
      if (entity.tripUpdate) {
        const tu = entity.tripUpdate;
        const tripId = `${src.feedPrefix}:${tu.trip?.tripId ?? entity.id}`;
        for (const stu of tu.stopTimeUpdate ?? []) {
          const stopId = stu.stopId ? `${src.feedPrefix}:${stu.stopId}` : null;
          const arrival = stu.arrival?.time as number | undefined;
          const departure = stu.departure?.time as number | undefined;
          const delay = stu.departure?.delay ?? stu.arrival?.delay ?? null;
          const predicted = departure ?? arrival;
          await this.ds.query(
            `INSERT INTO realtime_update (trip_id, stop_id, type, delay_seconds, predicted_time, new_platform, fetched_at)
             VALUES ($1,$2,$3,$4,$5,$6,now())`,
            [
              tripId,
              stopId,
              'delay',
              delay,
              predicted ? new Date(Number(predicted) * 1000) : null,
              null,
            ],
          );
          if (stopId) {
            const dep: Partial<Departure> = {
              tripId,
              stopId,
              delaySeconds: delay ?? 0,
              ...(arrival ? { scheduledTime: new Date(Number(arrival) * 1000).toISOString() } : {}),
              ...(predicted
                ? { predictedTime: new Date(Number(predicted) * 1000).toISOString() }
                : {}),
              status: stu.scheduleRelationship === 1 ? 'cancelled' : 'delayed',
            };
            this.gateway.server?.of('/live').to(`stop:${stopId}`).emit('departure:update', dep);
          }
        }
      }

      // Service alerts → disruption rows
      if (entity.alert) {
        const a = entity.alert;
        const start = a.activePeriod?.[0]?.start as number | undefined;
        const end = a.activePeriod?.[0]?.end as number | undefined;
        const title = a.headerText?.translation?.[0]?.text ?? null;
        const desc = a.descriptionText?.translation?.[0]?.text ?? null;
        const language =
          a.headerText?.translation?.[0]?.language ??
          a.descriptionText?.translation?.[0]?.language ??
          null;
        const severity = this.mapSeverity(a.severityLevel);
        const id = `${src.feedPrefix}:${entity.id}`;
        await this.ds.query(
          `INSERT INTO disruption (id, type, severity, title, description, start_time, end_time, affected_lines, affected_stops, language)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             severity = EXCLUDED.severity,
             start_time = EXCLUDED.start_time,
             end_time = EXCLUDED.end_time`,
          [
            id,
            this.mapEffectToType(a.effect),
            severity,
            title,
            desc,
            start ? new Date(Number(start) * 1000) : null,
            end ? new Date(Number(end) * 1000) : null,
            (a.informedEntity ?? [])
              .filter((e) => e.routeId)
              .map((e) => `${src.feedPrefix}:${e.routeId}`),
            (a.informedEntity ?? [])
              .filter((e) => e.stopId)
              .map((e) => `${src.feedPrefix}:${e.stopId}`),
            language,
          ],
        );
      }
    }
  }

  private mapSeverity(level?: number | null): string {
    switch (level) {
      case 1:
        return 'info';
      case 2:
        return 'minor';
      case 3:
        return 'major';
      case 4:
        return 'critical';
      default:
        return 'minor';
    }
  }

  private mapEffectToType(effect?: number | null): string {
    switch (effect) {
      case 1:
        return 'detour';
      case 2:
        return 'cancellation';
      case 4:
        return 'maintenance';
      case 5:
        return 'detour';
      case 6:
        return 'replacement_service';
      case 8:
        return 'strike';
      case 9:
        return 'platform_change';
      default:
        return 'delay';
    }
  }
}
