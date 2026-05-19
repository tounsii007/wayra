import { Module } from '@nestjs/common';
import { RealtimeController } from './realtime.controller';
import { RealtimeService } from './realtime.service';
import { RealtimeGateway } from './realtime.gateway';
import { GtfsRtWorker } from './gtfs-rt.worker';
import { PlacesModule } from '../places/places.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [PlacesModule, DatabaseModule],
  controllers: [RealtimeController],
  providers: [RealtimeService, RealtimeGateway, GtfsRtWorker],
  exports: [RealtimeService, RealtimeGateway, GtfsRtWorker],
})
export class RealtimeModule {}
