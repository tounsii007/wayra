import { Controller, Get, Header, Module, OnModuleInit, Res } from '@nestjs/common';
import type { Response } from 'express';
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

export const httpRequests = new Counter({
  name: 'wayra_http_requests_total',
  help: 'HTTP requests by method, route, status',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpDuration = new Histogram({
  name: 'wayra_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const cacheHits = new Counter({
  name: 'wayra_cache_hits_total',
  help: 'CacheService hits/misses',
  labelNames: ['result'],
  registers: [register],
});

@Controller()
class MetricsController implements OnModuleInit {
  onModuleInit() {
    collectDefaultMetrics({ register, prefix: 'wayra_' });
  }

  @Get('metrics')
  @Header('content-type', 'text/plain; version=0.0.4')
  async metrics(@Res() res: Response) {
    res.type('text/plain; version=0.0.4');
    res.send(await register.metrics());
  }
}

@Module({ controllers: [MetricsController] })
export class MetricsModule {}
