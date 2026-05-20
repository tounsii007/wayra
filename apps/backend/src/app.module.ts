import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { PlacesModule } from './modules/places/places.module';
import { RoutesModule } from './modules/routes/routes.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { FaresModule } from './modules/fares/fares.module';
import { AiModule } from './modules/ai/ai.module';
import { OfflineModule } from './modules/offline/offline.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountModule } from './modules/account/account.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { MetricsModule } from './modules/metrics/metrics.module';

import { ResponseEnvelopeInterceptor } from './common/response-envelope.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AppCacheModule } from './common/cache.module';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
        // Pretty print in dev only; structured JSON in prod for log aggregators.
        transport: isProd
          ? undefined
          : { target: 'pino-pretty', options: { singleLine: true, colorize: true } },
        genReqId: (req, res) => {
          const incoming =
            (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
          res.setHeader('x-request-id', incoming);
          return incoming;
        },
        // Strip secrets/PII from log output.
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.currentPassword',
            'req.body.newPassword',
            'req.body.idToken',
            'req.body.refreshToken',
          ],
          censor: '[redacted]',
        },
        customSuccessMessage: (req, res) => `${req.method} ${req.url} → ${res.statusCode}`,
        customErrorMessage: (req, res) => `${req.method} ${req.url} → ${res.statusCode}`,
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CacheModule.register({ isGlobal: true, ttl: 30_000 }),

    DatabaseModule,
    AppCacheModule,
    ProvidersModule,
    HealthModule,
    PlacesModule,
    RoutesModule,
    RealtimeModule,
    FaresModule,
    AiModule,
    OfflineModule,
    AuthModule,
    AccountModule,
    NotificationsModule,
    AdminModule,
    MetricsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
