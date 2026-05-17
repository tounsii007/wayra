import type { Coordinates, Address } from './geo';
import type { CountryCode, Locale } from './common';

export type PlaceType =
  | 'city'
  | 'neighborhood'
  | 'street'
  | 'address'
  | 'station'        // major rail station (Hbf, Gare)
  | 'stop'           // bus/tram/metro stop
  | 'metro_station'
  | 'tram_stop'
  | 'bus_stop'
  | 'airport'
  | 'poi'
  | 'landmark';

export interface Place {
  id: string;
  type: PlaceType;
  name: string;
  /** Localized name variants (e.g. {ar: "تونس", fr: "Tunis"}) */
  localizedNames?: Partial<Record<Locale, string>>;
  coordinates: Coordinates;
  address?: Address;
  countryCode: CountryCode;
  /** Modes available at this place (for stations/stops) */
  modes?: TransitMode[];
  /** Parent place — e.g. a stop's parent station */
  parentId?: string;
  /** External IDs from data sources (GTFS, OSM, IBNR, etc.) */
  externalIds?: Record<string, string>;
}

export type TransitMode =
  | 'rail'           // long-distance and regional trains
  | 'subway'         // metro / U-Bahn
  | 'tram'
  | 'bus'
  | 'coach'          // long-distance bus (Fernbus)
  | 'ferry'
  | 'cable'
  | 'walk'
  | 'bike'
  | 'car'
  | 'taxi';

export interface PlaceSuggestion {
  place: Place;
  /** Score 0-1, higher = more relevant */
  score: number;
  /** Distance in meters from user location, if applicable */
  distanceMeters?: number;
  /** Highlighted match positions for UI rendering */
  highlights?: Array<{ start: number; end: number }>;
}
