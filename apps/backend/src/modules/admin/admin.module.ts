import { Module } from '@nestjs/common';
import { AdminDisruptionsController } from './admin-disruptions.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RealtimeModule, AuthModule],
  controllers: [AdminDisruptionsController],
})
export class AdminModule {}
