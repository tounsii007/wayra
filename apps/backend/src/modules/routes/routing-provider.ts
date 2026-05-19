import type { PlanRouteRequest, PlanRouteResponse } from '@wayra/types';

/**
 * Strategy interface for the routing backend.
 *
 * Two implementations ship today:
 *   • MockRoutingProvider — synthesised candidates, default in dev.
 *   • OtpRoutingProvider  — calls OpenTripPlanner 2 over HTTP, enabled
 *     when ROUTING_PROVIDER=otp and OTP_URL is set.
 *
 * Swap is local to RoutesService — controllers/clients never see the change.
 */
export interface RoutingProvider {
  plan(req: PlanRouteRequest): Promise<PlanRouteResponse>;
  readonly name: string;
}

export const ROUTING_PROVIDER = Symbol('ROUTING_PROVIDER');
