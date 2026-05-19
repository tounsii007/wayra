import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
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

  /** Server-Sent Events stream of the assistant's reply. */
  @Post('travel-assistant/stream')
  async stream(@Body() req: AiAssistantRequest, @Res() res: Response) {
    res.setHeader('content-type', 'text/event-stream; charset=utf-8');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    res.flushHeaders?.();
    for await (const chunk of this.ai.streamRespond(req)) {
      res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
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
