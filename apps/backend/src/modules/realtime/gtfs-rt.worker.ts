import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';
import type { Departure } from '@wayra/types';

interface FeedSource {
  id: string;
  url: string;
  country: string;
  /** Header values needed for the request (e.g. authorization) */
  headers?: Record<string, string>;
}

/**
 * GTFS-Realtime polling worker.
 *
 * Production wiring:
 *   • Polls each configured feed every 30 s
 *   • Parses the `gtfs-realtime-bindings` Protocol Buffers payload
 *   • Persists deltas into `realtime_update`
 *   • Emits `departure:update` to subscribed Socket.IO rooms (`stop:<id>`)
 *
 * MVP wiring:
 *   • No protobuf dependency installed yet — the worker only emits a heartbeat
 *     `disruption:tick` every 30 s so connected clients can verify the channel.
 *   • Feed configuration is read from env so it can be swapped per deployment
 *     without code changes.
 */
@Injectable()
export class GtfsRtWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GtfsRtWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly sources: FeedSource[];
  private readonly enabled: boolean;

  constructor(
    config: ConfigService,
    private readonly gateway: RealtimeGateway,
  ) {
    this.enabled = config.get<string>('GTFS_RT_ENABLED') === 'true';
    this.sources = [
      {
        id: 'db',
        country: 'DE',
        url: config.get<string>('GTFS_RT_DB_URL') ?? '',
      },
      {
        id: 'sncf',
        country: 'FR',
        url: config.get<string>('GTFS_RT_SNCF_URL') ?? '',
      },
      {
        id: 'idfm',
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
    this.logger.log(`GTFS-RT worker starting — ${this.sources.length} feed(s) configured.`);
    this.timer = setInterval(() => this.tick().catch((e) => this.logger.error(e)), 30_000);
    // Fire one tick on startup for fast smoke testing.
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
        // Real path: parse with `gtfs-realtime-bindings`:
        //   const FeedMessage = require('gtfs-realtime-bindings').transit_realtime.FeedMessage;
        //   const buf = new Uint8Array(await res.arrayBuffer());
        //   const feed = FeedMessage.decode(buf);
        //   for (const entity of feed.entity) { … upsert + emit … }
        // For now we just log size as a heartbeat:
        const buf = await res.arrayBuffer();
        this.logger.debug(`feed ${src.id} ok, ${buf.byteLength} bytes`);
      } catch (e) {
        this.logger.warn(`feed ${src.id} failed: ${(e as Error).message}`);
      }
    }
    this.gateway.server?.of('/live').emit('worker:tick', {
      at: new Date().toISOString(),
      feeds: this.sources.map((s) => s.id),
    });
  }

  /**
   * Used by other services to push a single departure update into the
   * stream — e.g. when an admin marks a trip as cancelled.
   */
  pushDeparture(stopId: string, departure: Departure): void {
    this.gateway.server?.of('/live').to(`stop:${stopId}`).emit('departure:update', departure);
  }
}
