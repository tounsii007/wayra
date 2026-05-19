import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';

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

import { ResponseEnvelopeInterceptor } from './common/response-envelope.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CacheModule.register({ isGlobal: true, ttl: 30_000 }),

    DatabaseModule,
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
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
