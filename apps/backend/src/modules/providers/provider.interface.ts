import type { Coordinates, Departure, Disruption, Place, PlaceSuggestion } from '@wayra/types';

/**
 * Interface every provider client implements. Each method is optional
 * because not every provider exposes every endpoint — `ProviderRegistry`
 * picks the first one that can serve a given query.
 */
export interface TransitDataProvider {
  /** Stable id used in places' external_ids and in feed prefixes. */
  readonly id: string;
  /** Country this provider serves natively. */
  readonly country: 'DE' | 'FR' | 'TN';
  /** True only if the env keys this client needs are configured. */
  isConfigured(): boolean;

  searchPlaces?(
    query: string,
    opts?: { near?: Coordinates; limit?: number },
  ): Promise<PlaceSuggestion[]>;
  nearbyStops?(
    coords: Coordinates,
    radiusMeters: number,
    limit: number,
  ): Promise<Array<Place & { distanceMeters: number }>>;
  departures?(stopExternalId: string, limit?: number): Promise<Departure[]>;
  disruptions?(): Promise<Disruption[]>;
}
