import type { CountryCode } from './common';
import type { TransitMode } from './place';

export interface Agency {
  id: string;
  name: string;
  shortName?: string;
  countryCode: CountryCode;
  url?: string;
  /** GTFS feed identifier */
  feedId?: string;
}

export interface Line {
  id: string;
  agencyId: string;
  /** Short identifier — "S1", "U6", "RE7", "TGV 9580" */
  shortName: string;
  longName?: string;
  mode: TransitMode;
  /** Brand color (hex) — e.g. "#EC0016" for DB red */
  color?: string;
  textColor?: string;
}

export interface Trip {
  id: string;
  lineId: string;
  /** Headsign shown on the vehicle */
  headsign: string;
  /** Direction 0/1 in GTFS */
  direction?: 0 | 1;
  /** Wheelchair accessible */
  wheelchairAccessible?: boolean;
  /** Bicycles allowed */
  bikesAllowed?: boolean;
}
