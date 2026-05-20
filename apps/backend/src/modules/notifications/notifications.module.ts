import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushSender } from './push-sender.service';
import { OutboxWorker } from './outbox.worker';
import {
  NotificationOutboxEntity,
  PushSubscriptionEntity,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushSubscriptionEntity, NotificationOutboxEntity]),
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushSender, OutboxWorker],
  exports: [NotificationsService, PushSender],
})
export class NotificationsModule {}
