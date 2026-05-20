import { Injectable, Logger } from '@nestjs/common';
import type { TransitDataProvider } from './provider.interface';
import type { CountryCode } from '@wayra/types';
import { DbProvider } from './db.provider';
import { SncfProvider } from './sncf.provider';
import { IdfmProvider } from './idfm.provider';
import { SncftProvider } from './sncft.provider';

@Injectable()
export class ProviderRegistry {
  private readonly logger = new Logger(ProviderRegistry.name);
  private readonly all: TransitDataProvider[];

  constructor(db: DbProvider, sncf: SncfProvider, idfm: IdfmProvider, sncft: SncftProvider) {
    this.all = [db, sncf, idfm, sncft];
    const ready = this.all.filter((p) => p.isConfigured());
    this.logger.log(
      `Providers: ${this.all.map((p) => `${p.id}${p.isConfigured() ? '✓' : '·'}`).join(' ')} (${ready.length} configured)`,
    );
  }

  /** All providers that have actually been configured with API keys. */
  active(): TransitDataProvider[] {
    return this.all.filter((p) => p.isConfigured());
  }

  /** First active provider for the given country, if any. */
  forCountry(country?: CountryCode): TransitDataProvider | undefined {
    if (!country) return undefined;
    return this.active().find((p) => p.country === country);
  }

  /** All providers (configured or not) — useful for diagnostics. */
  list(): Array<{ id: string; country: string; ready: boolean }> {
    return this.all.map((p) => ({ id: p.id, country: p.country, ready: p.isConfigured() }));
  }
}
