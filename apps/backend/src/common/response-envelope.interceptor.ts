import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'node:crypto';

/**
 * Wraps every successful response into `{ data, meta }`.
 * Errors get the matching `{ error }` envelope from HttpExceptionFilter.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const requestId = randomUUID();
    return next.handle().pipe(map((data) => ({ data, meta: { requestId } })));
  }
}
