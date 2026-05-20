import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { PlacesService } from './places.service';

@ApiTags('places')
@Controller()
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'lat', required: false })
  @ApiQuery({ name: 'lng', required: false })
  @ApiQuery({ name: 'limit', required: false })
  search(
    @Query('q') q: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('limit') limit = '8',
  ) {
    const near = lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined;
    return this.places.autocomplete(q, { near, limit: Number(limit) });
  }

  @Get('places/autocomplete')
  autocomplete(@Query('q') q: string, @Query('limit') limit = '8') {
    return this.places.autocomplete(q, { limit: Number(limit) });
  }

  @Get('stops/nearby')
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusMeters') radius = '600',
    @Query('limit') limit = '10',
  ) {
    return this.places.nearbyStops(
      { lat: Number(lat), lng: Number(lng) },
      Number(radius),
      Number(limit),
    );
  }

  @Get('stations/:id')
  async byId(@Param('id') id: string) {
    const p = await this.places.findById(id);
    if (!p) throw new NotFoundException({ code: 'place_not_found', message: 'Place not found' });
    return p;
  }
}
