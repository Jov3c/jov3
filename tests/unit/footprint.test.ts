import { describe, expect, it } from 'vitest';

import { deriveFootprintVisited } from '../../shared/footprint';
import { footprintCitySchema, footprintMemorySchema } from '../../shared/schemas/footprint';

describe('Footprint contracts', () => {
  it('derives visited state only from visible memory count', () => {
    expect(deriveFootprintVisited(0)).toBe(false);
    expect(deriveFootprintVisited(1)).toBe(true);
    expect(deriveFootprintVisited(12)).toBe(true);
  });

  it('normalizes country codes and accepts a city provider code', () => {
    expect(
      footprintCitySchema.parse({
        slug: 'chengdu',
        countryCode: 'cn',
        countryName: 'China',
        cityName: '成都',
        regionName: '四川省',
        geoProvider: 'cn-atlas',
        geoCode: '51',
        localGeoJsonPath: null,
        sortOrder: 10,
      }),
    ).toMatchObject({ countryCode: 'CN', geoCode: '51' });
  });

  it('rejects traversal in a local boundary path', () => {
    expect(() =>
      footprintCitySchema.parse({
        slug: 'unsafe-city',
        countryCode: 'CN',
        countryName: 'China',
        cityName: 'Unsafe',
        regionName: null,
        geoProvider: 'local',
        geoCode: null,
        localGeoJsonPath: '../private/city.geojson',
        sortOrder: 0,
      }),
    ).toThrow();
  });

  it('requires a city and ordered media ids for a memory', () => {
    expect(
      footprintMemorySchema.parse({
        cityId: '2d4d1b9f-4c8a-44b3-b991-4bde7f9d3dd7',
        title: 'A quiet afternoon',
        body: 'A small memory worth keeping.',
        occurredOn: '2026-09-29',
        sortOrder: 0,
        visible: true,
        mediaIds: [],
      }),
    ).toMatchObject({ visible: true, mediaIds: [] });
  });

  it('rejects impossible calendar dates', () => {
    expect(() =>
      footprintMemorySchema.parse({
        cityId: '2d4d1b9f-4c8a-44b3-b991-4bde7f9d3dd7',
        title: 'Invalid date',
        body: 'This should not be accepted.',
        occurredOn: '2026-02-30',
        sortOrder: 0,
        visible: true,
        mediaIds: [],
      }),
    ).toThrow();
  });
});
