import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { FootprintGeoAdapter } from '../../server/services/footprint-geo';

const city = {
  slug: 'fixture-city',
  countryCode: 'CN',
  countryName: 'China',
  cityName: 'Fixture City',
  geoProvider: 'fixture',
  geoCode: '104.06,30.57',
  localGeoJsonPath: null,
};

describe('Footprint geo adapter', () => {
  const cacheDirs: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
      cacheDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  async function createCacheDir() {
    const directory = await mkdtemp(join(tmpdir(), 'jov3-footprint-'));
    cacheDirs.push(directory);
    return directory;
  }

  it('creates a deterministic feature collection for fixture coordinates', async () => {
    const result = await new FootprintGeoAdapter({ cacheDir: await createCacheDir() }).resolve(
      city,
    );

    expect(result.type).toBe('FeatureCollection');
    expect(result.features).toHaveLength(1);
    expect(result.features[0]?.properties).toMatchObject({ slug: 'fixture-city' });
  });

  it('adds city metadata to local boundary files for map selection', async () => {
    const cacheDir = await createCacheDir();
    await writeFile(
      join(cacheDir, 'city.geojson'),
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: null,
            properties: { source: 'local' },
          },
        ],
      }),
    );

    const result = await new FootprintGeoAdapter({ cacheDir }).resolve({
      ...city,
      localGeoJsonPath: 'city.geojson',
    });

    expect(result.features[0]?.properties).toMatchObject({
      source: 'local',
      slug: 'fixture-city',
      cityName: 'Fixture City',
    });
  });

  it('uses the provider code when resolving a remote Japan boundary', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'Feature',
          geometry: null,
          properties: { source: 'japan' },
        }),
        { status: 200, headers: { 'content-type': 'application/geo+json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await new FootprintGeoAdapter({ cacheDir: await createCacheDir() }).resolve({
      ...city,
      slug: 'tokyo',
      countryCode: 'JP',
      countryName: 'Japan',
      cityName: 'Tokyo',
      geoProvider: 'japan-prefecture',
      geoCode: '13',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/amay077/JapanPrefGeoJson/master/prefs/13.geojson',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('invalidates a remote cache when the provider code changes', async () => {
    const fetchMock = vi.fn(
      () =>
        new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
          status: 200,
          headers: { 'content-type': 'application/geo+json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new FootprintGeoAdapter({ cacheDir: await createCacheDir() });
    const remoteCity = {
      ...city,
      slug: 'tokyo',
      countryCode: 'JP',
      countryName: 'Japan',
      cityName: 'Tokyo',
      geoProvider: 'japan-prefecture',
      geoCode: '13',
    };

    await adapter.resolve(remoteCity);
    await adapter.resolve(remoteCity);
    await adapter.resolve({ ...remoteCity, geoCode: '27' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects unsupported providers with a stable error code', async () => {
    await expect(
      new FootprintGeoAdapter({ cacheDir: await createCacheDir() }).resolve({
        ...city,
        geoProvider: 'unknown-provider',
      }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_GEO_PROVIDER' });
  });
});
