/**
 * Re-export the pre-existing preference-aware mock as a strategy implementing
 * the RoutingProvider interface, so it can be selected via DI.
 */
import { Injectable } from '@nestjs/common';
import type { PlanRouteRequest, PlanRouteResponse } from '@wayra/types';
import { RoutesService } from './routes.service';
import type { RoutingProvider } from './routing-provider';

@Injectable()
export class MockRoutingProvider implements RoutingProvider {
  readonly name = 'mock';
  constructor(private readonly inner: RoutesService) {}
  plan(req: PlanRouteRequest): Promise<PlanRouteResponse> {
    return this.inner.plan(req);
  }
}
