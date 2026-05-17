import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AiAssistantRequest } from '@wayra/types';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('travel-assistant')
  travel(@Body() req: AiAssistantRequest) {
    return this.ai.respond(req);
  }

  @Post('explain-delay')
  explainDelay(@Body() body: { tripId: string; delaySeconds: number; locale?: string }) {
    return this.ai.explainDelay(body);
  }

  @Post('route-summary')
  routeSummary(@Body() body: { routeId: string; locale?: string }) {
    return this.ai.routeSummary(body);
  }
}
