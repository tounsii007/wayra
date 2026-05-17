import { Module } from '@nestjs/common';
import { FaresController } from './fares.controller';
import { FaresService } from './fares.service';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [PlacesModule],
  controllers: [FaresController],
  providers: [FaresService],
})
export class FaresModule {}
