import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Coordinates, Departure, Place, PlaceSuggestion } from '@wayra/types';
import { distanceMeters } from '@wayra/shared';
import type { TransitDataProvider } from './provider.interface';

/**
 * SNCF / Navitia provider.
 *
 * Uses the Navitia API (api.sncf.com): set `SNCF_API_KEY` to enable.
 * The same key works for both static stop search and live departures.
 */
@Injectable()
export class SncfProvider implements TransitDataProvider {
  readonly id = 'sncf';
  readonly country = 'FR';
  private readonly logger = new Logger(SncfProvider.name);
  private readonly apiKey?: string;
  private readonly base = 'https://api.sncf.com/v1/coverage/sncf';

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('SNCF_API_KEY') || undefined;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private auth(): HeadersInit {
    return { Authorization: this.apiKey ?? '', 'user-agent': 'wayra/0.7' };
  }

  async searchPlaces(
    query: string,
    opts: { near?: Coordinates; limit?: number } = {},
  ): Promise<PlaceSuggestion[]> {
    if (!this.isConfigured()) return [];
    try {
      const url = new URL(`${this.base}/places`);
      url.searchParams.set('q', query);
      url.searchParams.set('count', String(opts.limit ?? 8));
      url.searchParams.set('type[]', 'stop_area');
      const res = await fetch(url.toString(), { headers: this.auth() });
      if (!res.ok) return [];
      const json = (await res.json()) as {
        places?: Array<{
          id: string;
          name: string;
          embedded_type?: string;
          stop_area?: { coord?: { lat: string; lon: string } };
        }>;
      };
      return (json.places ?? []).flatMap<PlaceSuggestion>((p) => {
        const c = p.stop_area?.coord;
        if (!c) return [];
        const coords = { lat: Number(c.lat), lng: Number(c.lon) };
        const place: Place = {
          id: `sncf:${p.id}`,
          type: 'station',
          name: p.name,
          coordinates: coords,
          countryCode: 'FR',
          modes: ['rail'],
          externalIds: { sncf_id: p.id },
        };
        const score = p.name.toLowerCase().includes(query.toLowerCase()) ? 0.85 : 0.5;
        const distance = opts.near ? distanceMeters(opts.near, coords) : undefined;
        return [
          distance !== undefined ? { place, score, distanceMeters: distance } : { place, score },
        ];
      });
    } catch (e) {
      this.logger.warn(`searchPlaces failed: ${(e as Error).message}`);
      return [];
    }
  }

  async departures(stopExternalId: string, limit = 12): Promise<Departure[]> {
    if (!this.isConfigured()) return [];
    try {
      const id = stopExternalId.replace(/^sncf:/, '');
      const url = new URL(`${this.base}/stop_areas/${encodeURIComponent(id)}/departures`);
      url.searchParams.set('count', String(limit));
      const res = await fetch(url.toString(), { headers: this.auth() });
      if (!res.ok) return [];
      const data = (await res.json()) as {
        departures?: Array<{
          stop_date_time?: {
            base_departure_date_time?: string;
            departure_date_time?: string;
            departure_status?: string;
          };
          display_informations?: {
            direction?: string;
            label?: string;
            physical_mode?: string;
            color?: string;
            commercial_mode?: string;
            network?: string;
          };
        }>;
      };
      const isoFromNavitia = (s?: string): string | undefined =>
        s
          ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}`
          : undefined;

      return (data.departures ?? []).map((d, i) => {
        const sched = isoFromNavitia(d.stop_date_time?.base_departure_date_time);
        const pred = isoFromNavitia(d.stop_date_time?.departure_date_time);
        const delay =
          sched && pred
            ? Math.round((new Date(pred).getTime() - new Date(sched).getTime()) / 1000)
            : 0;
        const headsign = d.display_informations?.direction ?? '';
        return {
          tripId: `sncf:trip:${i}`,
          stopId: stopExternalId,
          line: {
            id: `sncf:${d.display_informations?.label ?? 'line'}`,
            agencyId: 'sncf',
            shortName: d.display_informations?.label ?? '—',
            mode: 'rail',
            ...(d.display_informations?.color && { color: `#${d.display_informations.color}` }),
          },
          trip: { id: `sncf:trip:${i}`, lineId: `sncf:${d.display_informations?.label}`, headsign },
          scheduledTime: sched ?? new Date().toISOString(),
          ...(pred && pred !== sched ? { predictedTime: pred } : {}),
          delaySeconds: delay,
          cancelled: d.stop_date_time?.departure_status === 'deleted',
          headsign,
          status:
            d.stop_date_time?.departure_status === 'deleted'
              ? 'cancelled'
              : delay > 0
                ? 'delayed'
                : 'on_time',
        };
      });
    } catch (e) {
      this.logger.warn(`departures failed: ${(e as Error).message}`);
      return [];
    }
  }
}
