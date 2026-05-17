import { Injectable, NotFoundException } from '@nestjs/common';

interface OfflineRegionInfo {
  id: string;
  name: string;
  countryCode: string;
  sizeBytes: number;
  version: string;
  /** Bounding box [west, south, east, north] */
  bbox: [number, number, number, number];
}

@Injectable()
export class OfflineService {
  private readonly regions: OfflineRegionInfo[] = [
    {
      id: 'de-berlin',
      name: 'Berlin',
      countryCode: 'DE',
      sizeBytes: 48 * 1024 * 1024,
      version: new Date().toISOString(),
      bbox: [13.0883, 52.3382, 13.7611, 52.6755],
    },
    {
      id: 'de-rhein-main',
      name: 'Frankfurt Rhein-Main',
      countryCode: 'DE',
      sizeBytes: 62 * 1024 * 1024,
      version: new Date().toISOString(),
      bbox: [8.2, 49.9, 9.1, 50.4],
    },
    {
      id: 'fr-paris',
      name: 'Paris & Île-de-France',
      countryCode: 'FR',
      sizeBytes: 71 * 1024 * 1024,
      version: new Date().toISOString(),
      bbox: [2.0, 48.6, 2.7, 49.05],
    },
    {
      id: 'tn-tunis',
      name: 'Tunis',
      countryCode: 'TN',
      sizeBytes: 28 * 1024 * 1024,
      version: new Date().toISOString(),
      bbox: [10.0, 36.7, 10.4, 36.95],
    },
  ];

  list() {
    return { regions: this.regions };
  }

  manifest(id: string) {
    const region = this.regions.find((r) => r.id === id);
    if (!region) {
      throw new NotFoundException({ code: 'region_not_found', message: 'Region not found' });
    }
    return {
      region,
      // Production: signed URLs to pre-built MBTiles + JSON shards.
      assets: [
        { kind: 'tiles', url: `https://cdn.wayra.app/offline/${id}/tiles.mbtiles` },
        { kind: 'stops', url: `https://cdn.wayra.app/offline/${id}/stops.json` },
        { kind: 'schedule', url: `https://cdn.wayra.app/offline/${id}/schedule.json` },
      ],
    };
  }
}
