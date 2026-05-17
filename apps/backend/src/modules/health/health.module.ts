import { Module, Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'wayra-backend', ts: new Date().toISOString() };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
