import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Coordinates, Place, PlaceSuggestion } from '@wayra/types';
import { distanceMeters } from '@wayra/shared';
import type { TransitDataProvider } from './provider.interface';

/**
 * Île-de-France Mobilités (PRIM) provider — Paris region transport.
 * Requires `IDFM_API_KEY` (PRIM portal). Currently exposes a stop-search
 * adapter; departures arrive in v0.9 with the Siri-Lite endpoint.
 */
@Injectable()
export class IdfmProvider implements TransitDataProvider {
  readonly id = 'idfm';
  readonly country = 'FR';
  private readonly logger = new Logger(IdfmProvider.name);
  private readonly apiKey?: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('IDFM_API_KEY') || undefined;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async searchPlaces(query: string, opts: { near?: Coordinates; limit?: number } = {}): Promise<PlaceSuggestion[]> {
    if (!this.isConfigured()) return [];
    try {
      const url = new URL(
        'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/coverage/fr-idf/places',
      );
      url.searchParams.set('q', query);
      url.searchParams.set('count', String(opts.limit ?? 8));
      url.searchParams.set('type[]', 'stop_area');
      const res = await fetch(url.toString(), {
        headers: { apikey: this.apiKey!, 'user-agent': 'wayra/0.7' },
      });
      if (!res.ok) return [];
      const json = (await res.json()) as {
        places?: Array<{
          id: string;
          name: string;
          stop_area?: { coord?: { lat: string; lon: string } };
        }>;
      };
      return (json.places ?? []).flatMap<PlaceSuggestion>((p) => {
        const c = p.stop_area?.coord;
        if (!c) return [];
        const coords = { lat: Number(c.lat), lng: Number(c.lon) };
        const place: Place = {
          id: `idfm:${p.id}`,
          type: 'station',
          name: p.name,
          coordinates: coords,
          countryCode: 'FR',
          modes: ['rail', 'subway', 'tram', 'bus'],
          externalIds: { idfm_id: p.id },
        };
        const score = p.name.toLowerCase().includes(query.toLowerCase()) ? 0.85 : 0.5;
        const distance = opts.near ? distanceMeters(opts.near, coords) : undefined;
        return [distance !== undefined ? { place, score, distanceMeters: distance } : { place, score }];
      });
    } catch (e) {
      this.logger.warn(`searchPlaces failed: ${(e as Error).message}`);
      return [];
    }
  }
}
