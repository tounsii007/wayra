import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { RouteQuery } from '@wayra/types';
import { FaresService } from './fares.service';

@ApiTags('fares')
@Controller('fares')
export class FaresController {
  constructor(private readonly fares: FaresService) {}

  @Post('estimate')
  estimate(@Body() req: RouteQuery) {
    return this.fares.estimate(req);
  }

  @Get('offers')
  offers(@Query('country') country?: string, @Query('type') type?: string) {
    return this.fares.offers({ country, type });
  }
}
