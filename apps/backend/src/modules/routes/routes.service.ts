import { Injectable, NotFoundException } from '@nestjs/common';
import { PlacesService } from '../places/places.service';
import { distanceMeters } from '@wayra/shared';
import type {
  PlanRouteRequest,
  PlanRouteResponse,
  Route,
  Coordinates,
  Place,
} from '@wayra/types';

/**
 * MVP routing engine — deterministic mock with realistic shape.
 *
 * Production replaces this with one of:
 *   • OpenTripPlanner 2 (Java) over a GTFS + OSM graph
 *   • Motis (C++)
 *   • Valhalla + Transitous
 * The interface stays identical so the swap is local to this service.
 */
@Injectable()
export class RoutesService {
  private cache = new Map<string, Route[]>();

  constructor(private readonly places: PlacesService) {}

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

    const km = distanceMeters(from.coordinates, to.coordinates) / 1000;
    const baseMinutes = Math.max(15, Math.round(km / 1.4 + 12));

    const departIso = req.departAt ?? new Date().toISOString();
    const departMs = new Date(departIso).getTime();

    const routes: Route[] = [
      this.buildRoute('fast', from, to, departMs, baseMinutes, 0, 39.9, 'fastest'),
      this.buildRoute('cheap', from, to, departMs + 18 * 60_000, baseMinutes + 60, 1, 19.9, 'cheapest'),
      this.buildRoute('direct', from, to, departMs + 40 * 60_000, baseMinutes - 5, 0, 69.9, 'fewest_transfers'),
    ];

    this.cache.set(routes[0]!.id, routes);
    routes.forEach((r) => this.cache.set(r.id, [r]));

    return { routes };
  }

  byId(id: string): Route {
    const r = [...this.cache.values()].flat().find((x) => x.id === id);
    if (!r) throw new NotFoundException({ code: 'route_not_found', message: 'Route not found' });
    return r;
  }

  alternativesFor(id: string): { routes: Route[] } {
    return { routes: [...this.cache.values()].flat().filter((x) => x.id !== id) };
  }

  // --- helpers ---

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

  private buildRoute(
    tag: string,
    from: Place,
    to: Place,
    departMs: number,
    minutes: number,
    transfers: number,
    fare: number,
    routeTag: 'fastest' | 'cheapest' | 'fewest_transfers',
  ): Route {
    const arriveMs = departMs + minutes * 60_000;
    return {
      id: `r-${tag}-${departMs}`,
      departureTime: new Date(departMs).toISOString(),
      arrivalTime: new Date(arriveMs).toISOString(),
      durationSeconds: minutes * 60,
      transfers,
      walkingMeters: 250 + transfers * 180,
      co2Grams: Math.round(minutes * 60),
      co2SavedGrams: Math.round(minutes * 280),
      fare: { amount: fare, currency: 'EUR', source: 'estimated' },
      tags: [routeTag, routeTag === 'fastest' ? 'recommended' : 'eco'],
      legs: [
        {
          mode: { kind: 'walk' },
          from,
          to: from,
          departureTime: new Date(departMs).toISOString(),
          arrivalTime: new Date(departMs + 3 * 60_000).toISOString(),
          distanceMeters: 200,
        },
        {
          mode: {
            kind: 'transit',
            mode: 'rail',
            line: {
              id: 'ice-stub',
              agencyId: 'db',
              shortName: routeTag === 'cheapest' ? 'IC' : 'ICE',
              mode: 'rail',
              color: routeTag === 'cheapest' ? '#0a4ea2' : '#EC0016',
            },
            trip: { id: `t-${tag}`, lineId: 'ice-stub', headsign: to.name },
          },
          from,
          to,
          departureTime: new Date(departMs + 3 * 60_000).toISOString(),
          arrivalTime: new Date(arriveMs - 3 * 60_000).toISOString(),
          distanceMeters: Math.round(
            distanceMeters(from.coordinates, to.coordinates),
          ),
          delaySeconds: routeTag === 'cheapest' ? 180 : 0,
        },
        {
          mode: { kind: 'walk' },
          from: to,
          to,
          departureTime: new Date(arriveMs - 3 * 60_000).toISOString(),
          arrivalTime: new Date(arriveMs).toISOString(),
          distanceMeters: 200,
        },
      ],
    };
  }
}
