import { Injectable, NotFoundException } from '@nestjs/common';
import { PlacesService } from '../places/places.service';
import { CacheService } from '../../common/cache.service';
import { distanceMeters } from '@wayra/shared';
import type {
  PlanRouteRequest,
  PlanRouteResponse,
  Route,
  RouteLeg,
  RouteTag,
  Coordinates,
  Place,
  TransitMode,
} from '@wayra/types';

/**
 * MVP routing engine — preference-aware deterministic mock.
 *
 * Production replacement: OpenTripPlanner 2 (Java sidecar) or Motis over a
 * GTFS + OSM graph. The interface here is intentionally identical to what
 * OTP returns, so the swap is local to this file.
 *
 * For now the mock honours the request:
 *   • wheelchair / stroller        → emits accessible legs and inflates time
 *   • preferences: [...]           → reorders + tags
 *   • departAt / arriveBy          → anchors the candidate timeline
 *   • modes                        → filters which mode each candidate uses
 *   • adults / children            → adjusts fare totals
 * It still returns three candidates per call; each candidate is differentiated
 * by mode, transfers, walking distance, and CO₂.
 */
/** TTL for cached routes — must outlast a "Plan → tap result → Trip details" flow. */
const ROUTE_CACHE_TTL_S = 30 * 60;

@Injectable()
export class RoutesService {
  constructor(
    private readonly places: PlacesService,
    private readonly cache: CacheService,
  ) {}

  async plan(req: PlanRouteRequest): Promise<PlanRouteResponse> {
    const from = await this.resolve(req.from);
    const to = await this.resolve(req.to);
    if (!from || !to) {
      return {
        routes: [],
        partial: true,
        notice: 'Origin or destination could not be resolved.',
      };
    }

    const meters = distanceMeters(from.coordinates, to.coordinates);
    const km = meters / 1000;
    if (km < 0.05) {
      return {
        routes: [],
        partial: true,
        notice: 'Origin and destination are essentially the same point.',
      };
    }

    const departIso = req.arriveBy
      ? this.backComputeDeparture(req.arriveBy, km)
      : req.departAt ?? new Date().toISOString();
    const departMs = new Date(departIso).getTime();
    if (Number.isNaN(departMs)) {
      return { routes: [], partial: true, notice: 'Invalid departure timestamp.' };
    }

    const accessible = !!(req.wheelchair || req.stroller);
    const adults = Math.max(1, req.adults ?? 1);
    const children = Math.max(0, req.children ?? 0);
    const passengerFactor = adults + children * 0.5;

    const candidates: Array<{
      tag: 'fastest' | 'cheapest' | 'fewest_transfers';
      modeMix: TransitMode[];
      offsetMin: number;
      minutes: number;
      transfers: number;
      walkM: number;
      fareBase: number;
      co2PerKmGrams: number;
    }> = [
      {
        tag: 'fastest',
        modeMix: km > 200 ? ['rail'] : ['subway', 'rail'],
        offsetMin: 5,
        minutes: this.estimateMinutes(km, 'fastest'),
        transfers: 0,
        walkM: 240 + (accessible ? 0 : 80),
        fareBase: 10 + 0.13 * km,
        co2PerKmGrams: km > 200 ? 14 : 32,
      },
      {
        tag: 'cheapest',
        modeMix: km > 200 ? ['coach', 'rail'] : ['bus', 'tram'],
        offsetMin: 22,
        minutes: this.estimateMinutes(km, 'cheapest'),
        transfers: 1,
        walkM: 380 + (accessible ? 0 : 160),
        fareBase: 5 + 0.045 * km,
        co2PerKmGrams: km > 200 ? 27 : 68,
      },
      {
        tag: 'fewest_transfers',
        modeMix: km > 50 ? ['rail'] : ['subway'],
        offsetMin: 41,
        minutes: this.estimateMinutes(km, 'direct'),
        transfers: 0,
        walkM: 180,
        fareBase: 18 + 0.18 * km,
        co2PerKmGrams: km > 200 ? 6 : 32,
      },
    ];

    const routes: Route[] = candidates
      .filter((c) => this.passesModeFilter(c.modeMix, req.modes))
      .map((c) =>
        this.buildRoute({
          tag: c.tag,
          from,
          to,
          departMs: departMs + c.offsetMin * 60_000,
          minutes: accessible ? Math.round(c.minutes * 1.15) : c.minutes,
          transfers: accessible ? Math.min(c.transfers, 1) : c.transfers,
          walkMeters: c.walkM,
          fareTotal: Math.round(c.fareBase * passengerFactor * 100) / 100,
          modeMix: c.modeMix,
          co2Grams: Math.round(km * c.co2PerKmGrams),
          accessible,
          km,
        }),
      );

    if (routes.length === 0) {
      return { routes: [], partial: true, notice: 'No route matches the requested modes.' };
    }

    const pref = req.preferences?.[0];
    if (pref === 'cheapest')
      routes.sort((a, b) => (a.fare?.amount ?? Infinity) - (b.fare?.amount ?? Infinity));
    else if (pref === 'fewest_transfers') routes.sort((a, b) => a.transfers - b.transfers);
    else if (pref === 'least_walking') routes.sort((a, b) => a.walkingMeters - b.walkingMeters);
    else routes.sort((a, b) => a.durationSeconds - b.durationSeconds);

    // Index the bundle under the first route's id, and each route under its own id.
    await this.cache.set(`route:bundle:${routes[0]!.id}`, routes, ROUTE_CACHE_TTL_S);
    await Promise.all(
      routes.map((r) => this.cache.set(`route:${r.id}`, r, ROUTE_CACHE_TTL_S)),
    );

    return { routes };
  }

  async byId(id: string): Promise<Route> {
    const r = await this.cache.get<Route>(`route:${id}`);
    if (!r) throw new NotFoundException({ code: 'route_not_found', message: 'Route not found' });
    return r;
  }

  async alternativesFor(id: string): Promise<{ routes: Route[] }> {
    const route = await this.cache.get<Route>(`route:${id}`);
    if (!route) return { routes: [] };
    const bundle = await this.cache.get<Route[]>(`route:bundle:${id}`);
    if (bundle) return { routes: bundle.filter((x) => x.id !== id) };
    // Walk all bundles in the index list to find siblings.
    return { routes: [] };
  }

  /** Index a route from any provider for later /routes/:id lookups. */
  async cacheRoute(r: Route): Promise<void> {
    await this.cache.set(`route:${r.id}`, r, ROUTE_CACHE_TTL_S);
  }

  // --- internals ---

  private async resolve(input: Coordinates | { placeId: string }): Promise<Place | undefined> {
    if ('placeId' in input) return this.places.findById(input.placeId);
    return {
      id: `${input.lat.toFixed(4)},${input.lng.toFixed(4)}`,
      type: 'address',
      name: `${input.lat.toFixed(4)}, ${input.lng.toFixed(4)}`,
      coordinates: input,
      countryCode: 'DE',
    };
  }

  /**
   * Distance → minutes, depending on candidate style. Numbers are coarse
   * proxies derived from typical European rail speeds.
   */
  private estimateMinutes(km: number, style: 'fastest' | 'cheapest' | 'direct'): number {
    const speed = style === 'fastest' ? 180 : style === 'direct' ? 150 : 75;
    const overheadMin = style === 'cheapest' ? 28 : style === 'direct' ? 14 : 10;
    return Math.max(8, Math.round((km / speed) * 60) + overheadMin);
  }

  private passesModeFilter(mix: TransitMode[], requested?: TransitMode[]): boolean {
    if (!requested || requested.length === 0) return true;
    return mix.some((m) => requested.includes(m));
  }

  private backComputeDeparture(arriveIso: string, km: number): string {
    const minutes = this.estimateMinutes(km, 'fastest');
    return new Date(new Date(arriveIso).getTime() - minutes * 60_000).toISOString();
  }

  private buildRoute(opts: {
    tag: 'fastest' | 'cheapest' | 'fewest_transfers';
    from: Place;
    to: Place;
    departMs: number;
    minutes: number;
    transfers: number;
    walkMeters: number;
    fareTotal: number;
    modeMix: TransitMode[];
    co2Grams: number;
    accessible: boolean;
    km: number;
  }): Route {
    const arriveMs = opts.departMs + opts.minutes * 60_000;
    const tags: RouteTag[] = [opts.tag];
    if (opts.tag === 'fastest') tags.push('recommended');
    if (opts.tag === 'fewest_transfers') tags.push('eco');
    if (opts.accessible) tags.push('accessible');

    // CO₂ vs. driving solo at 170 g/km
    const carCo2 = Math.round(opts.km * 170);
    const co2Saved = Math.max(0, carCo2 - opts.co2Grams);

    const transitLeg: RouteLeg = {
      mode: {
        kind: 'transit',
        mode: opts.modeMix[0] ?? 'rail',
        line: this.lineFor(opts.tag, opts.modeMix[0] ?? 'rail'),
        trip: { id: `t-${opts.tag}-${opts.departMs}`, lineId: 'mock', headsign: opts.to.name },
      },
      from: opts.from,
      to: opts.to,
      departureTime: new Date(opts.departMs + 3 * 60_000).toISOString(),
      arrivalTime: new Date(arriveMs - 3 * 60_000).toISOString(),
      distanceMeters: Math.round(opts.km * 1000),
      delaySeconds: opts.tag === 'cheapest' ? 180 : 0,
    };

    return {
      id: `r-${opts.tag}-${opts.departMs}`,
      departureTime: new Date(opts.departMs).toISOString(),
      arrivalTime: new Date(arriveMs).toISOString(),
      durationSeconds: opts.minutes * 60,
      transfers: opts.transfers,
      walkingMeters: opts.walkMeters,
      co2Grams: opts.co2Grams,
      co2SavedGrams: co2Saved,
      fare: { amount: opts.fareTotal, currency: 'EUR', source: 'estimated' },
      tags,
      wheelchairAccessible: opts.accessible,
      legs: [
        {
          mode: { kind: 'walk' },
          from: opts.from,
          to: opts.from,
          departureTime: new Date(opts.departMs).toISOString(),
          arrivalTime: new Date(opts.departMs + 3 * 60_000).toISOString(),
          distanceMeters: Math.round(opts.walkMeters / 2),
        },
        transitLeg,
        {
          mode: { kind: 'walk' },
          from: opts.to,
          to: opts.to,
          departureTime: new Date(arriveMs - 3 * 60_000).toISOString(),
          arrivalTime: new Date(arriveMs).toISOString(),
          distanceMeters: Math.round(opts.walkMeters / 2),
        },
      ],
    };
  }

  private lineFor(tag: 'fastest' | 'cheapest' | 'fewest_transfers', mode: TransitMode) {
    if (mode === 'coach')
      return { id: 'flx-coach', agencyId: 'flx', shortName: 'FlixBus', mode, color: '#73d700' };
    if (mode === 'bus') return { id: 'b-line', agencyId: 'local', shortName: '100', mode, color: '#7c3aed' };
    if (mode === 'tram') return { id: 't-line', agencyId: 'local', shortName: 'T1', mode, color: '#0ea5a5' };
    if (mode === 'subway') return { id: 'u-line', agencyId: 'local', shortName: 'U1', mode, color: '#1d4fd1' };
    const isCheap = tag === 'cheapest';
    return {
      id: isCheap ? 'ic-2' : 'ice-fast',
      agencyId: 'db',
      shortName: isCheap ? 'IC' : 'ICE',
      mode,
      color: isCheap ? '#0a4ea2' : '#EC0016',
    };
  }
}
