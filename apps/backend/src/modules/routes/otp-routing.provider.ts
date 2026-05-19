import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  PlanRouteRequest,
  PlanRouteResponse,
  Route,
  RouteLeg,
  TransitMode,
  Place,
} from '@wayra/types';
import { PlacesService } from '../places/places.service';
import type { RoutingProvider } from './routing-provider';

interface OtpItinerary {
  duration: number;
  startTime: number;
  endTime: number;
  walkDistance: number;
  transfers: number;
  legs: Array<{
    mode: string;
    startTime: number;
    endTime: number;
    distance: number;
    from: { name: string; lat: number; lon: number; stopId?: string };
    to: { name: string; lat: number; lon: number; stopId?: string };
    routeShortName?: string;
    routeColor?: string;
    headsign?: string;
    tripId?: string;
    legGeometry?: { points: string };
  }>;
  fare?: { amount: number; currency: string };
}

interface OtpPlanResponse {
  plan?: { itineraries: OtpItinerary[] };
  error?: { message?: string };
}

/**
 * Maps OpenTripPlanner 2 itineraries → Wayra `Route` objects.
 *
 * Expects OTP exposing the legacy planner endpoint at:
 *   GET ${OTP_URL}/otp/routers/${OTP_ROUTER}/plan?fromPlace=...&toPlace=...&mode=...
 */
@Injectable()
export class OtpRoutingProvider implements RoutingProvider {
  readonly name = 'otp';
  private readonly logger = new Logger(OtpRoutingProvider.name);
  private readonly url: string;
  private readonly router: string;

  constructor(config: ConfigService, private readonly places: PlacesService) {
    this.url = config.get<string>('OTP_URL') ?? '';
    this.router = config.get<string>('OTP_ROUTER') ?? 'default';
  }

  async plan(req: PlanRouteRequest): Promise<PlanRouteResponse> {
    const from = await this.resolveCoords(req.from);
    const to = await this.resolveCoords(req.to);
    if (!from || !to) {
      return { routes: [], partial: true, notice: 'Origin or destination could not be resolved.' };
    }

    const url = new URL(`${this.url.replace(/\/$/, '')}/otp/routers/${this.router}/plan`);
    url.searchParams.set('fromPlace', `${from.lat},${from.lng}`);
    url.searchParams.set('toPlace', `${to.lat},${to.lng}`);
    url.searchParams.set('mode', this.mapModes(req.modes));
    if (req.departAt) {
      const d = new Date(req.departAt);
      url.searchParams.set('date', d.toISOString().slice(0, 10));
      url.searchParams.set('time', d.toISOString().slice(11, 16));
    }
    if (req.arriveBy) {
      const d = new Date(req.arriveBy);
      url.searchParams.set('date', d.toISOString().slice(0, 10));
      url.searchParams.set('time', d.toISOString().slice(11, 16));
      url.searchParams.set('arriveBy', 'true');
    }
    if (req.wheelchair) url.searchParams.set('wheelchair', 'true');
    if (req.maxWalkMeters) url.searchParams.set('maxWalkDistance', String(req.maxWalkMeters));

    let json: OtpPlanResponse;
    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`OTP ${res.status}`);
      json = (await res.json()) as OtpPlanResponse;
    } catch (e) {
      this.logger.error(`OTP request failed: ${(e as Error).message}`);
      return { routes: [], partial: true, notice: 'Routing service unavailable.' };
    }

    if (json.error || !json.plan) {
      return { routes: [], partial: true, notice: json.error?.message ?? 'No plan returned.' };
    }

    const routes: Route[] = json.plan.itineraries.map((it, i) => this.mapItinerary(it, i));
    return { routes };
  }

  private async resolveCoords(input: PlanRouteRequest['from']) {
    if ('placeId' in input) {
      const place = await this.places.findById(input.placeId);
      return place?.coordinates;
    }
    return input;
  }

  private mapModes(modes?: TransitMode[]): string {
    if (!modes || modes.length === 0) return 'TRANSIT,WALK';
    const m = modes.map((x) => {
      switch (x) {
        case 'rail':
          return 'RAIL';
        case 'subway':
          return 'SUBWAY';
        case 'tram':
          return 'TRAM';
        case 'bus':
          return 'BUS';
        case 'coach':
          return 'BUS';
        case 'walk':
          return 'WALK';
        case 'bike':
          return 'BICYCLE';
        case 'car':
          return 'CAR';
        case 'ferry':
          return 'FERRY';
        default:
          return 'TRANSIT';
      }
    });
    return Array.from(new Set([...m, 'WALK'])).join(',');
  }

  private mapItinerary(it: OtpItinerary, i: number): Route {
    const legs: RouteLeg[] = it.legs.map((l) => {
      const fromPlace: Place = {
        id: l.from.stopId ?? `${l.from.lat},${l.from.lon}`,
        type: 'stop',
        name: l.from.name,
        coordinates: { lat: l.from.lat, lng: l.from.lon },
        countryCode: 'DE',
      };
      const toPlace: Place = {
        id: l.to.stopId ?? `${l.to.lat},${l.to.lon}`,
        type: 'stop',
        name: l.to.name,
        coordinates: { lat: l.to.lat, lng: l.to.lon },
        countryCode: 'DE',
      };
      if (l.mode === 'WALK') {
        return {
          mode: { kind: 'walk' },
          from: fromPlace,
          to: toPlace,
          departureTime: new Date(l.startTime).toISOString(),
          arrivalTime: new Date(l.endTime).toISOString(),
          distanceMeters: Math.round(l.distance),
        };
      }
      return {
        mode: {
          kind: 'transit',
          mode: this.mapOtpMode(l.mode),
          line: {
            id: l.tripId ?? `otp-${l.routeShortName}`,
            agencyId: 'otp',
            shortName: l.routeShortName ?? l.mode,
            mode: this.mapOtpMode(l.mode),
            color: l.routeColor ? `#${l.routeColor}` : undefined,
          },
          trip: { id: l.tripId ?? `otp-${i}`, lineId: 'otp', headsign: l.headsign ?? l.to.name },
        },
        from: fromPlace,
        to: toPlace,
        departureTime: new Date(l.startTime).toISOString(),
        arrivalTime: new Date(l.endTime).toISOString(),
        distanceMeters: Math.round(l.distance),
      };
    });

    return {
      id: `otp-${it.startTime}-${i}`,
      departureTime: new Date(it.startTime).toISOString(),
      arrivalTime: new Date(it.endTime).toISOString(),
      durationSeconds: it.duration,
      transfers: it.transfers,
      walkingMeters: Math.round(it.walkDistance),
      legs,
      fare: it.fare ? { amount: it.fare.amount, currency: it.fare.currency, source: 'estimated' } : undefined,
      tags: i === 0 ? ['recommended'] : [],
    };
  }

  private mapOtpMode(m: string): TransitMode {
    switch (m) {
      case 'RAIL':
        return 'rail';
      case 'SUBWAY':
        return 'subway';
      case 'TRAM':
        return 'tram';
      case 'BUS':
        return 'bus';
      case 'FERRY':
        return 'ferry';
      default:
        return 'rail';
    }
  }
}
