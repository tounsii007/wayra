import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * Tiny typed cache with Redis as the primary backend and an in-memory
 * Map as the fallback when REDIS_URL is unset. The Map fallback uses a
 * coarse TTL sweep so dev memory doesn't grow unbounded.
 *
 * Used by RoutesService so route IDs returned via `/api/routes/plan`
 * are resolvable by `/api/routes/:id` from any pod.
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private mem = new Map<string, { value: string; expiresAt: number }>();
  private sweeper?: NodeJS.Timeout;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (url) {
      this.redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
      this.redis.on('error', (e) => this.logger.warn(`redis: ${e.message}`));
      this.redis.connect().catch((e) => this.logger.warn(`redis connect: ${e.message}`));
    }
    this.sweeper = setInterval(() => this.sweep(), 60_000);
  }

  onModuleDestroy() {
    if (this.sweeper) clearInterval(this.sweeper);
    if (this.redis) void this.redis.quit().catch(() => undefined);
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.set(this.k(key), serialized, 'EX', ttlSeconds);
        return;
      } catch (e) {
        this.logger.warn(`redis SET fell back to memory: ${(e as Error).message}`);
      }
    }
    this.mem.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        const v = await this.redis.get(this.k(key));
        return v ? (JSON.parse(v) as T) : null;
      } catch (e) {
        this.logger.warn(`redis GET fell back to memory: ${(e as Error).message}`);
      }
    }
    const m = this.mem.get(key);
    if (!m) return null;
    if (m.expiresAt < Date.now()) {
      this.mem.delete(key);
      return null;
    }
    return JSON.parse(m.value) as T;
  }

  async del(key: string): Promise<void> {
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.del(this.k(key));
      } catch {
        /* fall through */
      }
    }
    this.mem.delete(key);
  }

  private k(key: string): string {
    return `wayra:${key}`;
  }

  private sweep() {
    const now = Date.now();
    for (const [k, v] of this.mem) if (v.expiresAt < now) this.mem.delete(k);
  }
}
