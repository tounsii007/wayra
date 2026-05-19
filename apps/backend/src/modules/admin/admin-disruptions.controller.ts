import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Disruption } from '@wayra/types';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { RealtimeService } from '../realtime/realtime.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
@Controller('admin/disruptions')
export class AdminDisruptionsController {
  constructor(private readonly rt: RealtimeService) {}

  @Get()
  list() {
    return this.rt.disruptions();
  }

  @Post()
  create(@Body() body: Disruption) {
    return this.rt.upsertDisruption(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Disruption>) {
    return this.rt.upsertDisruption({ ...body, id });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rt.deleteDisruption(id);
  }
}
