import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Coordinates, Disruption, Place, PlaceSuggestion, Departure } from '@wayra/types';
import { distanceMeters } from '@wayra/shared';
import type { TransitDataProvider } from './provider.interface';

interface DbStation {
  evaNumbers?: Array<{ number: number; geographicCoordinates?: { latitude: number; longitude: number } }>;
  number: number;
  name: string;
  category?: number;
  metropolis?: string;
}

/**
 * Deutsche Bahn Open Data wrapper.
 *
 * Uses the public "StaDa" station catalogue (no key) for stop lookups +
 * the DB Travel Information API for departures (requires DB_API_KEY +
 * DB_CLIENT_ID). When the keys aren't configured, only the public
 * endpoints are used, and `departures()` quietly returns [] so the
 * caller can fall back to the schedule table.
 */
@Injectable()
export class DbProvider implements TransitDataProvider {
  readonly id = 'db';
  readonly country = 'DE';
  private readonly logger = new Logger(DbProvider.name);
  private readonly apiKey: string | undefined;
  private readonly clientId: string | undefined;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('DB_API_KEY') || undefined;
    this.clientId = config.get<string>('DB_CLIENT_ID') || undefined;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.clientId);
  }

  async searchPlaces(query: string, opts: { near?: Coordinates; limit?: number } = {}): Promise<PlaceSuggestion[]> {
    try {
      const url = new URL('https://v6.db.transport.rest/locations');
      url.searchParams.set('query', query);
      url.searchParams.set('results', String(opts.limit ?? 8));
      url.searchParams.set('addresses', 'false');
      url.searchParams.set('poi', 'false');
      const res = await fetch(url.toString(), { headers: { 'user-agent': 'wayra/0.7' } });
      if (!res.ok) return [];
      const data = (await res.json()) as Array<{
        id: string;
        name: string;
        location?: { latitude: number; longitude: number };
        products?: Record<string, boolean>;
      }>;
      return data
        .filter((d) => d.location)
        .map<PlaceSuggestion>((d) => {
          const coords = { lat: d.location!.latitude, lng: d.location!.longitude };
          const place: Place = {
            id: `db:${d.id}`,
            type: 'station',
            name: d.name,
            coordinates: coords,
            countryCode: 'DE',
            modes: this.modesFromProducts(d.products),
            externalIds: { db_id: d.id, ibnr: d.id },
          };
          const score = query && d.name.toLowerCase().includes(query.toLowerCase()) ? 0.85 : 0.5;
          const distance = opts.near ? distanceMeters(opts.near, coords) : undefined;
          return distance !== undefined ? { place, score, distanceMeters: distance } : { place, score };
        });
    } catch (e) {
      this.logger.warn(`searchPlaces failed: ${(e as Error).message}`);
      return [];
    }
  }

  async departures(stopExternalId: string, limit = 12): Promise<Departure[]> {
    if (!this.isConfigured()) return [];
    try {
      const id = stopExternalId.replace(/^db:/, '');
      const url = new URL(`https://v6.db.transport.rest/stops/${encodeURIComponent(id)}/departures`);
      url.searchParams.set('duration', '90');
      url.searchParams.set('results', String(limit));
      const res = await fetch(url.toString(), {
        headers: {
          'user-agent': 'wayra/0.7',
          'db-client-id': this.clientId!,
          'db-api-key': this.apiKey!,
        },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as {
        departures?: Array<{
          tripId: string;
          when?: string;
          plannedWhen?: string;
          delay?: number;
          platform?: string;
          plannedPlatform?: string;
          direction?: string;
          cancelled?: boolean;
          line?: { id?: string; name?: string; product?: string };
        }>;
      };
      return (data.departures ?? []).map((d) => ({
        tripId: `db:${d.tripId}`,
        stopId: stopExternalId,
        line: {
          id: d.line?.id ? `db:line:${d.line.id}` : 'db:unknown',
          agencyId: 'db',
          shortName: d.line?.name ?? '—',
          mode: this.modeFromProduct(d.line?.product),
        },
        trip: { id: `db:${d.tripId}`, lineId: d.line?.id ?? 'unknown', headsign: d.direction ?? '' },
        scheduledTime: d.plannedWhen ?? d.when ?? new Date().toISOString(),
        ...(d.when && d.plannedWhen && d.when !== d.plannedWhen ? { predictedTime: d.when } : {}),
        delaySeconds: d.delay ?? 0,
        ...(d.platform ? { platform: d.platform } : {}),
        platformChanged: !!(d.platform && d.plannedPlatform && d.platform !== d.plannedPlatform),
        cancelled: !!d.cancelled,
        headsign: d.direction ?? '',
        status: d.cancelled ? 'cancelled' : (d.delay ?? 0) > 0 ? 'delayed' : 'on_time',
      }));
    } catch (e) {
      this.logger.warn(`departures failed: ${(e as Error).message}`);
      return [];
    }
  }

  async disruptions(): Promise<Disruption[]> {
    // The public bahnhof.de RSS works without a key; in production swap to
    // the official Hafas /remarks endpoint.
    return [];
  }

  // ---- helpers ----

  private modesFromProducts(p?: Record<string, boolean>): Place['modes'] {
    if (!p) return undefined;
    const out: NonNullable<Place['modes']> = [];
    if (p.nationalExpress || p.national || p.regionalExpress || p.regional) out.push('rail');
    if (p.suburban) out.push('rail');
    if (p.subway) out.push('subway');
    if (p.tram) out.push('tram');
    if (p.bus) out.push('bus');
    if (p.ferry) out.push('ferry');
    return out.length > 0 ? out : undefined;
  }

  private modeFromProduct(p?: string): 'rail' | 'subway' | 'tram' | 'bus' | 'ferry' {
    switch (p) {
      case 'subway':
        return 'subway';
      case 'tram':
        return 'tram';
      case 'bus':
        return 'bus';
      case 'ferry':
        return 'ferry';
      default:
        return 'rail';
    }
  }
}
