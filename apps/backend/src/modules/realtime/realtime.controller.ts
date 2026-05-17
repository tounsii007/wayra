import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RealtimeService } from './realtime.service';

@ApiTags('realtime')
@Controller('realtime')
export class RealtimeController {
  constructor(private readonly rt: RealtimeService) {}

  @Get('departures')
  departures(
    @Query('stopId') stopId: string,
    @Query('limit') limit = '12',
    @Query('windowMinutes') windowMinutes = '90',
  ) {
    if (!stopId) {
      throw new BadRequestException({ code: 'missing_stop_id', message: 'stopId is required' });
    }
    return this.rt.departures(stopId, Number(limit), Number(windowMinutes));
  }

  @Get('disruptions')
  disruptions(@Query('country') country?: string) {
    return this.rt.disruptions(country);
  }

  @Get('trip/:tripId')
  trip(@Param('tripId') tripId: string) {
    return this.rt.trip(tripId);
  }
}
