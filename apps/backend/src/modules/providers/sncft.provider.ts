import { Injectable } from '@nestjs/common';
import type { TransitDataProvider } from './provider.interface';

/**
 * SNCFT — there is no first-party real-time API at the time of writing.
 * This provider stays in the registry so the routing/places services
 * can ask "do we have a TN provider?" without conditionals everywhere.
 * Until SNCFT exposes data, we rely on the GTFS importer + the local
 * `place` / `stop_time` tables.
 */
@Injectable()
export class SncftProvider implements TransitDataProvider {
  readonly id = 'sncft';
  readonly country = 'TN';
  isConfigured(): boolean {
    return false;
  }
}
