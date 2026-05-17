import { Injectable } from '@nestjs/common';
import type { FareComparison, FareOffer, RouteQuery } from '@wayra/types';

@Injectable()
export class FaresService {
  /**
   * Returns a fare comparison for a given route query.
   * MVP: estimates based on country and rough distance.
   * Production: integrates DB, SNCF, SNCFT, Verbund tariffs, plus
   * Deutschlandticket / Pass Rail Jeune detection.
   */
  estimate(_req: RouteQuery): { comparison: FareComparison } {
    const offers: FareOffer[] = [
      {
        id: 'de:db:spar',
        agencyId: 'db',
        countryCode: 'DE',
        type: 'saver',
        name: 'Sparpreis',
        amount: 19.9,
        currency: 'EUR',
        source: 'estimated',
        description: 'Buchungsklasse Sparpreis (geschätzt)',
      },
      {
        id: 'de:db:flex',
        agencyId: 'db',
        countryCode: 'DE',
        type: 'flex',
        name: 'Flexpreis',
        amount: 79.9,
        currency: 'EUR',
        source: 'estimated',
      },
      {
        id: 'de:deutschlandticket',
        agencyId: 'verbund',
        countryCode: 'DE',
        type: 'month',
        name: 'Deutschlandticket',
        amount: 58.0,
        currency: 'EUR',
        source: 'official',
        description: 'Bundesweit gültig im Nahverkehr.',
      },
    ];

    return {
      comparison: {
        cheapest: offers[0],
        offers,
        hasEstimatesOnly: offers.some((o) => o.source !== 'official'),
      },
    };
  }

  offers({ country, type }: { country?: string; type?: string }): { offers: FareOffer[] } {
    const all: FareOffer[] = [
      {
        id: 'de:deutschlandticket',
        agencyId: 'verbund',
        countryCode: 'DE',
        type: 'month',
        name: 'Deutschlandticket',
        amount: 58.0,
        currency: 'EUR',
        source: 'official',
      },
      {
        id: 'fr:tgvmax',
        agencyId: 'sncf',
        countryCode: 'FR',
        type: 'month',
        name: 'Max Jeune',
        amount: 79.0,
        currency: 'EUR',
        source: 'official',
      },
      {
        id: 'tn:sncft:single',
        agencyId: 'sncft',
        countryCode: 'TN',
        type: 'single',
        name: 'Billet Tunis–Sousse',
        amount: 11.5,
        currency: 'TND',
        source: 'estimated',
      },
    ];
    return {
      offers: all.filter(
        (o) =>
          (!country || o.countryCode === country) && (!type || o.type === type),
      ),
    };
  }
}
