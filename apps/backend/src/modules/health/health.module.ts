import { Module, Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

interface ProbeResult {
  status: 'ok' | 'degraded';
  service: 'wayra-backend';
  version: string;
  ts: string;
  checks: {
    db: { ok: boolean; latencyMs?: number; error?: string };
    redis: { ok: boolean; latencyMs?: number; error?: string };
  };
}

@ApiTags('health')
@Controller()
class HealthController {
  private redis: Redis | null = null;
  private readonly version: string;

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    config: ConfigService,
  ) {
    this.version = config.get<string>('npm_package_version') ?? '0.0.0';
    const url = config.get<string>('REDIS_URL');
    if (url) {
      this.redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    }
  }

  @Get('health')
  async live() {
    return { status: 'ok', service: 'wayra-backend', ts: new Date().toISOString() };
  }

  @Get('health/ready')
  async ready(): Promise<ProbeResult> {
    const out: ProbeResult = {
      status: 'ok',
      service: 'wayra-backend',
      version: this.version,
      ts: new Date().toISOString(),
      checks: { db: { ok: false }, redis: { ok: false } },
    };

    const dbStart = Date.now();
    try {
      await this.ds.query('SELECT 1');
      out.checks.db = { ok: true, latencyMs: Date.now() - dbStart };
    } catch (e) {
      out.checks.db = { ok: false, error: (e as Error).message };
      out.status = 'degraded';
    }

    if (this.redis) {
      const rStart = Date.now();
      try {
        const reply = await this.redis.ping();
        out.checks.redis = { ok: reply === 'PONG', latencyMs: Date.now() - rStart };
        if (reply !== 'PONG') out.status = 'degraded';
      } catch (e) {
        out.checks.redis = { ok: false, error: (e as Error).message };
        out.status = 'degraded';
      }
    } else {
      out.checks.redis = { ok: true };
    }
    return out;
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
