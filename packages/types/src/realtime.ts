import type { ISODateString } from './common';
import type { Line, Trip } from './transit';
import type { Place } from './place';

export type DisruptionSeverity = 'info' | 'minor' | 'major' | 'critical';

export type DisruptionType =
  | 'delay'
  | 'cancellation'
  | 'platform_change'
  | 'detour'
  | 'replacement_service'
  | 'strike'
  | 'maintenance'
  | 'weather'
  | 'other';

export interface Disruption {
  id: string;
  type: DisruptionType;
  severity: DisruptionSeverity;
  title: string;
  description: string;
  startTime: ISODateString;
  endTime?: ISODateString;
  affectedLines?: Line[];
  affectedStops?: Place[];
  /** URL to provider's official announcement */
  sourceUrl?: string;
  /** ISO language code of the text */
  language?: string;
}

export interface Departure {
  tripId: string;
  line: Line;
  trip: Trip;
  stopId: string;
  scheduledTime: ISODateString;
  /** Real-time predicted time, if available */
  predictedTime?: ISODateString;
  /** Delay in seconds */
  delaySeconds?: number;
  /** Platform / track */
  platform?: string;
  /** Has the platform changed? */
  platformChanged?: boolean;
  /** Is the trip cancelled? */
  cancelled?: boolean;
  /** Headsign */
  headsign: string;
  /** Status colour for UI */
  status: 'on_time' | 'delayed' | 'cancelled' | 'unknown';
}

export interface TripUpdate {
  tripId: string;
  stopTimeUpdates: Array<{
    stopId: string;
    scheduledArrival?: ISODateString;
    scheduledDeparture?: ISODateString;
    predictedArrival?: ISODateString;
    predictedDeparture?: ISODateString;
    delaySeconds?: number;
    skipped?: boolean;
  }>;
  alerts?: Disruption[];
}
