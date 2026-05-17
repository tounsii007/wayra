import { Body, Controller, Post, Get, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import type { PlanRouteRequest } from '@wayra/types';
import { RoutesService } from './routes.service';

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  @Post('plan')
  @ApiBody({ description: 'Multimodal trip plan request', required: true })
  plan(@Body() body: PlanRouteRequest) {
    if (!body?.from || !body?.to) {
      throw new BadRequestException({
        code: 'missing_origin_or_destination',
        message: 'Both from and to are required.',
      });
    }
    return this.routes.plan(body);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.routes.byId(id);
  }

  @Get(':id/alternatives')
  alternatives(@Param('id') id: string) {
    return this.routes.alternativesFor(id);
  }
}
