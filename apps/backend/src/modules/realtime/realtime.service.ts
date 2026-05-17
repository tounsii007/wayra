import { Injectable } from '@nestjs/common';
import type { Departure, Disruption, TripUpdate, Line } from '@wayra/types';
import { PlacesService } from '../places/places.service';

/**
 * Realtime service.
 *
 * Production wires to GTFS-RT feeds (DB, SNCF, IDFM, SNCFT, …). Until that
 * lands, we synthesise departures and disruptions that:
 *   • depend on the stop's country and the modes it advertises
 *   • produce believable headsigns (other places in the same country)
 *   • mark live data as unavailable so the UI can show a clear notice
 */
@Injectable()
export class RealtimeService {
  constructor(private readonly places: PlacesService) {}

  async departures(
    stopId: string,
    limit: number,
    windowMinutes: number,
  ): Promise<{
    stop: { id: string; name?: string };
    departures: Departure[];
    liveDataAvailable: boolean;
    cachedAt: string;
  }> {
    const stop = await this.places.findById(stopId);
    const country = stop?.countryCode ?? 'DE';
    const modes = stop?.modes ?? ['rail', 'subway'];

    const candidates = (
      await this.places.autocomplete('', { countryCodes: [country], limit: 8 })
    ).suggestions
      .map((s) => s.place)
      .filter((p) => p.id !== stopId);
    const fallbackHeadsigns = this.fallbackHeadsignsFor(country);
    const headsignSource = candidates.length > 0 ? candidates.map((p) => p.name) : fallbackHeadsigns;

    const lineCatalogue = this.lineCatalogueFor(country, modes);

    const now = Date.now();
    const out: Departure[] = [];
    for (let i = 0; i < limit; i++) {
      const offset = 3 + i * 5;
      if (offset > windowMinutes) break;
      const line = lineCatalogue[i % lineCatalogue.length]!;
      const cancelled = i === 6;
      const delaySeconds = cancelled ? 0 : i === 2 ? 240 : i === 5 ? 60 : 0;
      const platformChanged = i === 4;
      const headsign = headsignSource[i % headsignSource.length] ?? 'Demo Destination';
      const scheduled = new Date(now + offset * 60_000);
      out.push({
        tripId: `${stopId}-trip-${i}`,
        line,
        trip: { id: `${stopId}-trip-${i}`, lineId: line.id, headsign },
        stopId,
        scheduledTime: scheduled.toISOString(),
        delaySeconds: cancelled ? undefined : delaySeconds,
        predictedTime:
          delaySeconds > 0
            ? new Date(scheduled.getTime() + delaySeconds * 1000).toISOString()
            : undefined,
        platform: this.platformFor(line.mode, i),
        platformChanged,
        cancelled,
        headsign,
        status: cancelled ? 'cancelled' : delaySeconds > 0 ? 'delayed' : 'on_time',
      });
    }

    return {
      stop: { id: stopId, name: stop?.name },
      departures: out,
      liveDataAvailable: false,
      cachedAt: new Date().toISOString(),
    };
  }

  disruptions(country?: string): { disruptions: Disruption[] } {
    const c = country?.toUpperCase();
    const all: Disruption[] = [
      {
        id: 'de-s1-signal',
        type: 'delay',
        severity: 'minor',
        title: 'S1 — leichte Verzögerung',
        description:
          'Aufgrund eines Signalproblems verkehrt die S1 mit bis zu 8 Minuten Verspätung zwischen Frankfurt Hbf und Höchst.',
        startTime: new Date().toISOString(),
        affectedLines: [{ id: 'de:s1', agencyId: 'rmv', shortName: 'S1', mode: 'rail' }],
        language: 'de',
      },
      {
        id: 'fr-ter-greve',
        type: 'strike',
        severity: 'major',
        title: 'Grève SNCF — TER Île-de-France',
        description: 'Le trafic TER est fortement perturbé jusqu’à 18h00.',
        startTime: new Date().toISOString(),
        affectedLines: [{ id: 'fr:ter', agencyId: 'sncf', shortName: 'TER', mode: 'rail' }],
        language: 'fr',
      },
      {
        id: 'tn-m1-slow',
        type: 'delay',
        severity: 'minor',
        title: 'Métro Tunis · Ligne 1 ralentie',
        description: 'Fréquence réduite à cause de travaux sur la voie.',
        startTime: new Date().toISOString(),
        affectedLines: [{ id: 'tn:m1', agencyId: 'transtu', shortName: 'M1', mode: 'tram' }],
        language: 'fr',
      },
      {
        id: 'de-u8-platform',
        type: 'platform_change',
        severity: 'info',
        title: 'BVG U8 — Gleiswechsel am Alexanderplatz',
        description: 'Bis morgen früh Abfahrt am Gleis 2 statt 1.',
        startTime: new Date().toISOString(),
        affectedLines: [{ id: 'de:u8', agencyId: 'bvg', shortName: 'U8', mode: 'subway' }],
        language: 'de',
      },
    ];
    return { disruptions: c ? all.filter((d) => this.disruptionMatchesCountry(d, c)) : all };
  }

  trip(tripId: string): TripUpdate {
    return { tripId, stopTimeUpdates: [], alerts: [] };
  }

  /**
   * High-level network status per major city — drives the home page banner.
   * Production reads this from an aggregation of `disruption` rows.
   */
  networkStatus(country?: string): {
    items: Array<{ city: string; country: 'DE' | 'FR' | 'TN'; status: 'ok' | 'minor' | 'major'; note: string; locale: string }>;
    generatedAt: string;
  } {
    const all: Array<{
      city: string;
      country: 'DE' | 'FR' | 'TN';
      status: 'ok' | 'minor' | 'major';
      note: string;
      locale: string;
    }> = [
      { city: 'Berlin', country: 'DE', status: 'ok', note: 'S-Bahn pünktlich', locale: 'de' },
      { city: 'Frankfurt', country: 'DE', status: 'ok', note: 'U-Bahn nach Plan', locale: 'de' },
      { city: 'Hamburg', country: 'DE', status: 'major', note: 'S-Bahn Streik', locale: 'de' },
      { city: 'Paris', country: 'FR', status: 'minor', note: 'Ligne 4 — perturbations', locale: 'fr' },
      { city: 'Lyon', country: 'FR', status: 'ok', note: 'TCL — trafic normal', locale: 'fr' },
      { city: 'Tunis', country: 'TN', status: 'minor', note: 'Métro 1 ralentie', locale: 'fr' },
      { city: 'Sousse', country: 'TN', status: 'ok', note: 'SNCFT à l’heure', locale: 'fr' },
    ];
    return {
      items: country ? all.filter((x) => x.country === country.toUpperCase()) : all,
      generatedAt: new Date().toISOString(),
    };
  }

  // --- helpers ---

  private disruptionMatchesCountry(d: Disruption, country: string): boolean {
    const map: Record<string, string[]> = { DE: ['de'], FR: ['fr'], TN: ['fr', 'ar'] };
    const allowed = map[country] ?? [];
    return !d.language || allowed.includes(d.language.toLowerCase());
  }

  private lineCatalogueFor(country: string, modes: string[]): Line[] {
    const all: Record<string, Line[]> = {
      DE: [
        { id: 'de:s1', agencyId: 'rmv', shortName: 'S1', mode: 'rail', color: '#16a34a' },
        { id: 'de:u8', agencyId: 'bvg', shortName: 'U8', mode: 'subway', color: '#1d4fd1' },
        { id: 'de:ice', agencyId: 'db', shortName: 'ICE', mode: 'rail', color: '#EC0016' },
        { id: 'de:re', agencyId: 'db', shortName: 'RE', mode: 'rail', color: '#7c3aed' },
        { id: 'de:tram-15', agencyId: 'rnv', shortName: '15', mode: 'tram', color: '#0ea5a5' },
      ],
      FR: [
        { id: 'fr:rer-a', agencyId: 'ratp', shortName: 'RER A', mode: 'rail', color: '#e30713' },
        { id: 'fr:m1', agencyId: 'ratp', shortName: 'M1', mode: 'subway', color: '#ffce00' },
        { id: 'fr:tgv', agencyId: 'sncf', shortName: 'TGV', mode: 'rail', color: '#1d4fd1' },
        { id: 'fr:ter', agencyId: 'sncf', shortName: 'TER', mode: 'rail', color: '#16a34a' },
      ],
      TN: [
        { id: 'tn:m1', agencyId: 'transtu', shortName: 'M1', mode: 'tram', color: '#0ea5a5' },
        { id: 'tn:m4', agencyId: 'transtu', shortName: 'M4', mode: 'tram', color: '#7c3aed' },
        { id: 'tn:sncft', agencyId: 'sncft', shortName: 'SNCFT', mode: 'rail', color: '#dc2626' },
      ],
    };
    const list = all[country] ?? all.DE!;
    return list.filter((l) => modes.length === 0 || modes.includes(l.mode));
  }

  private fallbackHeadsignsFor(country: string): string[] {
    if (country === 'FR') return ['Paris Nord', 'Lyon Part-Dieu', 'Marseille St-Charles'];
    if (country === 'TN') return ['Tunis Marine', 'Sousse', 'Sfax'];
    return ['Berlin Hbf', 'Frankfurt Hbf', 'München Hbf'];
  }

  private platformFor(mode: string, i: number): string | undefined {
    if (mode === 'subway' || mode === 'tram' || mode === 'bus') return ['A', 'B', 'C'][i % 3];
    if (mode === 'rail') return String((i % 11) + 1);
    return undefined;
  }
}
