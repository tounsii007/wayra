import { distanceMeters, boundingBoxFor, formatDistance } from '../src/geo';

describe('geo.distanceMeters', () => {
  it('returns 0 for the same point', () => {
    expect(distanceMeters({ lat: 52.5, lng: 13.4 }, { lat: 52.5, lng: 13.4 })).toBe(0);
  });

  it('approximates Berlin → Munich within a few %', () => {
    const berlin = { lat: 52.52, lng: 13.405 };
    const munich = { lat: 48.137, lng: 11.575 };
    const d = distanceMeters(berlin, munich);
    // Real great-circle distance ≈ 504 km
    expect(d).toBeGreaterThan(500_000);
    expect(d).toBeLessThan(510_000);
  });

  it('is symmetric', () => {
    const a = { lat: 36.79, lng: 10.17 }; // Tunis
    const b = { lat: 35.82, lng: 10.64 }; // Sousse
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 5);
  });
});

describe('geo.boundingBoxFor', () => {
  it('produces a strictly-ordered box', () => {
    const bbox = boundingBoxFor({ lat: 48.85, lng: 2.35 }, 5_000);
    expect(bbox.north).toBeGreaterThan(bbox.south);
    expect(bbox.east).toBeGreaterThan(bbox.west);
  });
});

describe('geo.formatDistance', () => {
  it('shows meters under 1 km', () => {
    expect(formatDistance(420, 'en')).toBe('420 m');
  });
  it('shows km with one decimal', () => {
    expect(formatDistance(1234, 'en')).toMatch(/1\.2 km/);
  });
});
