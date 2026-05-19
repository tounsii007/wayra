import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushSender } from './push-sender.service';
import { PushSubscriptionEntity } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscriptionEntity]), AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushSender],
  exports: [NotificationsService, PushSender],
})
export class NotificationsModule {}
