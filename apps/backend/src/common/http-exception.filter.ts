import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'internal_error';
    let message = 'Something went wrong.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      if (typeof r === 'string') {
        message = r;
      } else if (typeof r === 'object' && r) {
        const obj = r as { message?: string | string[]; error?: string; code?: string };
        message = Array.isArray(obj.message) ? obj.message.join(', ') : (obj.message ?? message);
        code = obj.code ?? obj.error?.toLowerCase().replace(/\s+/g, '_') ?? `http_${status}`;
        details = obj;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack);
    }

    res.status(status).json({
      error: { code, message, ...(details ? { details } : {}) },
      meta: { requestId, path: req.url },
    });
  }
}
