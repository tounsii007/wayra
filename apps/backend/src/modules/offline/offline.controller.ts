import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OfflineService } from './offline.service';

@ApiTags('offline')
@Controller('offline')
export class OfflineController {
  constructor(private readonly offline: OfflineService) {}

  @Get('regions')
  list() {
    return this.offline.list();
  }

  @Get('download/:regionId')
  download(@Param('regionId') regionId: string) {
    return this.offline.manifest(regionId);
  }
}
