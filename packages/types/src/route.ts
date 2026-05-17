import type { Coordinates, GeoLineString } from './geo';
import type { ISODateString } from './common';
import type { Place, TransitMode } from './place';
import type { Line, Trip } from './transit';

export type RoutePreference =
  | 'fastest'
  | 'cheapest'
  | 'fewest_transfers'
  | 'least_walking'
  | 'accessible'      // wheelchair / stroller friendly
  | 'most_comfortable'
  | 'night';

export interface RouteQuery {
  from: Coordinates | { placeId: string };
  to: Coordinates | { placeId: string };
  /** ISO date — defaults to now */
  departAt?: ISODateString;
  /** Use arrival time instead of departure */
  arriveBy?: ISODateString;
  modes?: TransitMode[];
  preferences?: RoutePreference[];
  /** Passengers — affects fare */
  adults?: number;
  children?: number;
  /** Maximum walking distance to/from stops (meters) */
  maxWalkMeters?: number;
  /** Accessibility requirements */
  wheelchair?: boolean;
  stroller?: boolean;
  bike?: boolean;
}

export type LegMode =
  | { kind: 'transit'; mode: TransitMode; line: Line; trip: Trip }
  | { kind: 'walk' }
  | { kind: 'bike' }
  | { kind: 'transfer' };

export interface RouteLeg {
  mode: LegMode;
  from: Place;
  to: Place;
  departureTime: ISODateString;
  arrivalTime: ISODateString;
  /** Real-time delay in seconds, if known */
  delaySeconds?: number;
  /** Platform / track */
  fromPlatform?: string;
  toPlatform?: string;
  /** Intermediate stops on this leg */
  intermediateStops?: Place[];
  /** Distance in meters */
  distanceMeters: number;
  /** Geometry of the leg path */
  geometry?: GeoLineString;
  /** Occupancy estimate */
  occupancy?: OccupancyLevel;
}

export type OccupancyLevel = 'empty' | 'low' | 'medium' | 'high' | 'full' | 'unknown';

export interface Route {
  id: string;
  legs: RouteLeg[];
  departureTime: ISODateString;
  arrivalTime: ISODateString;
  /** Total duration in seconds */
  durationSeconds: number;
  /** Number of transfers */
  transfers: number;
  /** Total walking distance in meters */
  walkingMeters: number;
  /** Estimated fare */
  fare?: FareEstimate;
  /** CO2 emissions in grams */
  co2Grams?: number;
  /** CO2 saved vs driving */
  co2SavedGrams?: number;
  /** Accessibility flags */
  wheelchairAccessible?: boolean;
  /** Tags for sorting/filtering */
  tags?: RouteTag[];
}

export type RouteTag =
  | 'fastest'
  | 'cheapest'
  | 'fewest_transfers'
  | 'recommended'
  | 'accessible'
  | 'eco';

export interface FareEstimate {
  amount: number;
  currency: string;
  /** Source: 'official' | 'estimated' | 'unknown' */
  source: 'official' | 'estimated' | 'unknown';
  /** Human-readable note (e.g. "Deutschlandticket gilt") */
  note?: string;
}
