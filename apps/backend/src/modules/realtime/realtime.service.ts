import { Injectable } from '@nestjs/common';
import type { Departure, Disruption, TripUpdate } from '@wayra/types';

/**
 * Realtime stub. Production wires this to GTFS-RT feeds:
 *   • DB (Deutsche Bahn) — https://developers.deutschebahn.com
 *   • SNCF — https://api.sncf.com
 *   • Île-de-France Mobilités, RATP open data
 *   • SNCFT / TRANSTU / Metro Tunis — bestef.fort to import via published timetables
 * Feeds are polled every ~30s, parsed, and stored in `realtime_update` for
 * fan-out via WebSocket (RealtimeGateway).
 */
@Injectable()
export class RealtimeService {
  departures(
    stopId: string,
    limit: number,
    windowMinutes: number,
  ): { stop: { id: string }; departures: Departure[]; liveDataAvailable: boolean; cachedAt: string } {
    const now = Date.now();
    const out: Departure[] = [];
    for (let i = 0; i < limit; i++) {
      const offset = 4 + i * 6;
      if (offset > windowMinutes) break;
      out.push({
        tripId: `${stopId}-trip-${i}`,
        line: {
          id: i % 2 === 0 ? 'S1' : 'U8',
          agencyId: 'demo',
          shortName: i % 2 === 0 ? 'S1' : 'U8',
          mode: i % 2 === 0 ? 'rail' : 'subway',
          color: i % 2 === 0 ? '#16a34a' : '#1d4fd1',
        },
        trip: { id: `${stopId}-trip-${i}`, lineId: 'S1', headsign: 'Demo Destination' },
        stopId,
        scheduledTime: new Date(now + offset * 60_000).toISOString(),
        delaySeconds: i === 2 ? 240 : 0,
        platform: i % 2 === 0 ? '3' : 'A',
        platformChanged: false,
        cancelled: false,
        headsign: 'Demo Destination',
        status: i === 2 ? 'delayed' : 'on_time',
      });
    }
    return {
      stop: { id: stopId },
      departures: out,
      liveDataAvailable: false, // surface clearly to UI
      cachedAt: new Date().toISOString(),
    };
  }

  disruptions(country?: string): { disruptions: Disruption[] } {
    const all: Disruption[] = [
      {
        id: 'demo-1',
        type: 'delay',
        severity: 'minor',
        title: 'S1 leichte Verzögerung',
        description: 'Aufgrund eines Signalproblems verkehrt die S1 mit bis zu 8 Minuten Verspätung.',
        startTime: new Date().toISOString(),
        affectedLines: [{ id: 'S1', agencyId: 'demo', shortName: 'S1', mode: 'rail' }],
        language: 'de',
      },
      {
        id: 'demo-2',
        type: 'strike',
        severity: 'major',
        title: 'Grève SNCF — TER Île-de-France',
        description: 'Le trafic TER est fortement perturbé.',
        startTime: new Date().toISOString(),
        affectedLines: [],
        language: 'fr',
      },
    ];
    const filtered = country
      ? all.filter((d) =>
          d.language?.toLowerCase().startsWith(country.toLowerCase().slice(0, 2)),
        )
      : all;
    return { disruptions: filtered };
  }

  trip(tripId: string): TripUpdate {
    return {
      tripId,
      stopTimeUpdates: [],
      alerts: [],
    };
  }
}
