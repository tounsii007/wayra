import { BadRequestException, Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import type { PlanRouteRequest } from '@wayra/types';
import { RoutesService } from './routes.service';
import { ROUTING_PROVIDER, type RoutingProvider } from './routing-provider';

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
  constructor(
    @Inject(ROUTING_PROVIDER) private readonly provider: RoutingProvider,
    private readonly cache: RoutesService,
  ) {}

  @Post('plan')
  @ApiBody({ description: 'Multimodal trip plan request', required: true })
  async plan(@Body() body: PlanRouteRequest) {
    if (!body?.from || !body?.to) {
      throw new BadRequestException({
        code: 'missing_origin_or_destination',
        message: 'Both from and to are required.',
      });
    }
    const result = await this.provider.plan(body);
    await Promise.all(result.routes.map((r) => this.cache.cacheRoute(r)));
    return result;
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.cache.byId(id);
  }

  @Get(':id/alternatives')
  alternatives(@Param('id') id: string) {
    return this.cache.alternativesFor(id);
  }
}
