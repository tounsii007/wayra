import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PlacesModule } from '../places/places.module';
import { RoutesModule } from '../routes/routes.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PlacesModule, RoutesModule, RealtimeModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
