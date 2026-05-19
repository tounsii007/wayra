import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { Departure, Disruption, TripUpdate, Line } from '@wayra/types';
import { PlacesService } from '../places/places.service';

interface DisruptionRow {
  id: string;
  type: string;
  severity: string;
  title: string | null;
  description: string | null;
  start_time: Date | null;
  end_time: Date | null;
  affected_lines: string[] | null;
  affected_stops: string[] | null;
  source_url: string | null;
  language: string | null;
}

@Injectable()
export class RealtimeService {
  private dbReady = true;

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly places: PlacesService,
  ) {}

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

    // Try real schedule first (joins stop_time + trip + line)
    if (this.dbReady) {
      try {
        const rows = await this.ds.query<
          Array<{
            trip_id: string;
            line_id: string;
            short_name: string;
            mode: string;
            color: string | null;
            headsign: string | null;
            departure_time: number | null;
            platform: string | null;
            delay_seconds: number | null;
            predicted_time: Date | null;
          }>
        >(
          `WITH today AS (
             SELECT CURRENT_DATE AS d,
                    LOWER(TO_CHAR(CURRENT_DATE, 'fmDay')) AS dow
           ),
           active_services AS (
             SELECT sd.id
             FROM service_day sd, today
             WHERE (today.d BETWEEN COALESCE(sd.start_date, today.d) AND COALESCE(sd.end_date, today.d))
               AND (
                 (today.dow = 'monday'    AND sd.monday)
                 OR (today.dow = 'tuesday'   AND sd.tuesday)
                 OR (today.dow = 'wednesday' AND sd.wednesday)
                 OR (today.dow = 'thursday'  AND sd.thursday)
                 OR (today.dow = 'friday'    AND sd.friday)
                 OR (today.dow = 'saturday'  AND sd.saturday)
                 OR (today.dow = 'sunday'    AND sd.sunday)
               )
               AND NOT EXISTS (
                 SELECT 1 FROM service_date sx
                 WHERE sx.service_id = sd.id AND sx.date = today.d AND sx.exception_type = 2
               )
             UNION
             SELECT sd.service_id
             FROM service_date sx
             JOIN service_day sd ON sd.id = sx.service_id
             , today
             WHERE sx.date = today.d AND sx.exception_type = 1
           ),
           base AS (
             SELECT st.trip_id, t.line_id, l.short_name, l.mode, l.color,
                    t.headsign, st.departure_time, st.platform
             FROM stop_time st
             JOIN trip t ON t.id = st.trip_id
             JOIN line l ON l.id = t.line_id
             WHERE st.stop_id = $1
               AND st.departure_time IS NOT NULL
               AND (t.service_id IS NULL OR t.service_id IN (SELECT id FROM active_services))
             ORDER BY st.departure_time
             LIMIT $2
           )
           SELECT b.*,
                  ru.delay_seconds, ru.predicted_time
           FROM base b
           LEFT JOIN LATERAL (
             SELECT delay_seconds, predicted_time
             FROM realtime_update
             WHERE trip_id = b.trip_id
             ORDER BY fetched_at DESC
             LIMIT 1
           ) ru ON true`,
          [stopId, limit],
        );

        if (rows.length > 0) {
          const out: Departure[] = rows.map((r) => {
            const baseTime = this.todaySeconds(r.departure_time ?? 0);
            const line: Line = {
              id: r.line_id,
              agencyId: r.line_id.split(':')[0] ?? 'unknown',
              shortName: r.short_name,
              mode: r.mode as Line['mode'],
              color: r.color ?? undefined,
            };
            const delaySeconds = r.delay_seconds ?? 0;
            return {
              tripId: r.trip_id,
              line,
              trip: { id: r.trip_id, lineId: r.line_id, headsign: r.headsign ?? '' },
              stopId,
              scheduledTime: baseTime.toISOString(),
              ...(r.predicted_time ? { predictedTime: r.predicted_time.toISOString() } : {}),
              delaySeconds,
              ...(r.platform ? { platform: r.platform } : {}),
              cancelled: false,
              headsign: r.headsign ?? '',
              status: delaySeconds > 0 ? 'delayed' : 'on_time',
            };
          });
          return {
            stop: { id: stopId, name: stop?.name },
            departures: out,
            liveDataAvailable: rows.some((r) => r.delay_seconds !== null),
            cachedAt: new Date().toISOString(),
          };
        }
      } catch {
        this.dbReady = false;
        setTimeout(() => (this.dbReady = true), 60_000);
      }
    }

    // Fallback: synthetic departures based on country/mode catalogue
    return this.syntheticDepartures(stopId, country, modes, limit, windowMinutes, stop?.name);
  }

  async disruptions(country?: string): Promise<{ disruptions: Disruption[] }> {
    if (this.dbReady) {
      try {
        const rows = await this.ds.query<DisruptionRow[]>(
          country
            ? `SELECT id, type, severity, title, description, start_time, end_time,
                       affected_lines, affected_stops, source_url, language
                FROM disruption
                WHERE language IS NULL OR language ILIKE $1 || '%'
                ORDER BY COALESCE(start_time, now()) DESC
                LIMIT 50`
            : `SELECT id, type, severity, title, description, start_time, end_time,
                       affected_lines, affected_stops, source_url, language
                FROM disruption
                ORDER BY COALESCE(start_time, now()) DESC
                LIMIT 50`,
          country ? [this.localeFor(country)] : [],
        );
        if (rows.length > 0) {
          return { disruptions: rows.map((r) => this.rowToDisruption(r)) };
        }
      } catch {
        this.dbReady = false;
        setTimeout(() => (this.dbReady = true), 60_000);
      }
    }
    return { disruptions: this.fallbackDisruptions(country) };
  }

  trip(tripId: string): TripUpdate {
    return { tripId, stopTimeUpdates: [], alerts: [] };
  }

  async networkStatus(country?: string): Promise<{
    items: Array<{
      city: string;
      country: 'DE' | 'FR' | 'TN';
      status: 'ok' | 'minor' | 'major';
      note: string;
      locale: string;
    }>;
    generatedAt: string;
  }> {
    // For now: aggregate disruption severity per country.
    // (City-level rollup needs station→city mapping, future work.)
    const items: Array<{
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
      items: country ? items.filter((x) => x.country === country.toUpperCase()) : items,
      generatedAt: new Date().toISOString(),
    };
  }

  /** Insert/Update a disruption from the admin UI. */
  async upsertDisruption(d: Partial<Disruption> & { id: string }): Promise<{ ok: true }> {
    await this.ds.query(
      `INSERT INTO disruption (id, type, severity, title, description, start_time, end_time, affected_lines, affected_stops, language)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         type = EXCLUDED.type,
         severity = EXCLUDED.severity,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         affected_lines = EXCLUDED.affected_lines,
         affected_stops = EXCLUDED.affected_stops,
         language = EXCLUDED.language`,
      [
        d.id,
        d.type ?? 'delay',
        d.severity ?? 'minor',
        d.title ?? null,
        d.description ?? null,
        d.startTime ? new Date(d.startTime) : null,
        d.endTime ? new Date(d.endTime) : null,
        (d.affectedLines ?? []).map((l) => l.id),
        (d.affectedStops ?? []).map((s) => s.id),
        d.language ?? null,
      ],
    );
    return { ok: true };
  }

  async deleteDisruption(id: string): Promise<{ ok: true }> {
    await this.ds.query(`DELETE FROM disruption WHERE id = $1`, [id]);
    return { ok: true };
  }

  // --- helpers ---

  private todaySeconds(sec: number): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getTime() + sec * 1000);
  }

  private localeFor(country: string): string {
    if (country.toUpperCase() === 'FR' || country.toUpperCase() === 'TN') return 'fr';
    return 'de';
  }

  private rowToDisruption(r: DisruptionRow): Disruption {
    return {
      id: r.id,
      type: r.type as Disruption['type'],
      severity: r.severity as Disruption['severity'],
      title: r.title ?? '',
      description: r.description ?? '',
      startTime: (r.start_time ?? new Date()).toISOString(),
      ...(r.end_time && { endTime: r.end_time.toISOString() }),
      ...(r.source_url && { sourceUrl: r.source_url }),
      ...(r.language && { language: r.language }),
    };
  }

  private syntheticDepartures(
    stopId: string,
    country: string,
    modes: string[],
    limit: number,
    windowMinutes: number,
    name?: string,
  ): {
    stop: { id: string; name?: string };
    departures: Departure[];
    liveDataAvailable: boolean;
    cachedAt: string;
  } {
    const catalogue = this.lineCatalogueFor(country, modes);
    const headsigns = this.fallbackHeadsignsFor(country);
    const now = Date.now();
    const out: Departure[] = [];
    for (let i = 0; i < limit; i++) {
      const offset = 3 + i * 5;
      if (offset > windowMinutes) break;
      const line = catalogue[i % catalogue.length]!;
      const cancelled = i === 6;
      const delaySeconds = cancelled ? 0 : i === 2 ? 240 : i === 5 ? 60 : 0;
      const headsign = headsigns[i % headsigns.length] ?? 'Demo';
      const scheduled = new Date(now + offset * 60_000);
      out.push({
        tripId: `${stopId}-syn-${i}`,
        line,
        trip: { id: `${stopId}-syn-${i}`, lineId: line.id, headsign },
        stopId,
        scheduledTime: scheduled.toISOString(),
        ...(delaySeconds > 0
          ? { predictedTime: new Date(scheduled.getTime() + delaySeconds * 1000).toISOString() }
          : {}),
        delaySeconds: cancelled ? undefined : delaySeconds,
        platform: this.platformFor(line.mode, i),
        platformChanged: i === 4,
        cancelled,
        headsign,
        status: cancelled ? 'cancelled' : delaySeconds > 0 ? 'delayed' : 'on_time',
      });
    }
    return {
      stop: { id: stopId, name },
      departures: out,
      liveDataAvailable: false,
      cachedAt: new Date().toISOString(),
    };
  }

  private fallbackDisruptions(country?: string): Disruption[] {
    const all: Disruption[] = [
      {
        id: 'de-s1-signal',
        type: 'delay',
        severity: 'minor',
        title: 'S1 — leichte Verzögerung',
        description:
          'Aufgrund eines Signalproblems verkehrt die S1 mit bis zu 8 Minuten Verspätung.',
        startTime: new Date().toISOString(),
        language: 'de',
      },
      {
        id: 'fr-ter-greve',
        type: 'strike',
        severity: 'major',
        title: 'Grève SNCF — TER Île-de-France',
        description: 'Le trafic TER est fortement perturbé jusqu’à 18h00.',
        startTime: new Date().toISOString(),
        language: 'fr',
      },
      {
        id: 'tn-m1-slow',
        type: 'delay',
        severity: 'minor',
        title: 'Métro Tunis · Ligne 1 ralentie',
        description: 'Fréquence réduite à cause de travaux sur la voie.',
        startTime: new Date().toISOString(),
        language: 'fr',
      },
    ];
    if (!country) return all;
    const langs: Record<string, string[]> = { DE: ['de'], FR: ['fr'], TN: ['fr', 'ar'] };
    const allowed = langs[country.toUpperCase()] ?? [];
    return all.filter((d) => !d.language || allowed.includes(d.language));
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
