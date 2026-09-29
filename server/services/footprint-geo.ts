import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export interface FootprintGeoCity {
  slug: string;
  countryCode: string;
  countryName: string;
  cityName: string;
  geoProvider: string;
  geoCode: string | null;
  localGeoJsonPath: string | null;
}

export interface FootprintGeoJsonFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown> | null;
}

export interface FootprintGeoJson {
  type: 'FeatureCollection';
  features: FootprintGeoJsonFeature[];
}

export class FootprintGeoError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'FootprintGeoError';
    this.code = code;
  }
}

export function footprintGeoApiError(error: unknown) {
  if (error instanceof FootprintGeoError) {
    return {
      statusCode: error.code === 'GEO_BOUNDARY_UNAVAILABLE' ? 502 : 422,
      code: error.code,
      message: error.message,
    };
  }
  return null;
}

export interface FootprintGeoAdapterOptions {
  cacheDir?: string;
  fetcher?: typeof fetch;
}

export class FootprintGeoAdapter {
  private readonly cacheDir: string;
  private readonly fetcher: typeof fetch;

  constructor(options: FootprintGeoAdapterOptions = {}) {
    const configured = options.cacheDir?.trim() || process.env.FOOTPRINT_GEO_CACHE_DIR?.trim();
    this.cacheDir = resolve(configured || join(process.cwd(), '.data', 'geo', 'cities'));
    this.fetcher = options.fetcher ?? fetch;
  }

  async resolve(city: FootprintGeoCity): Promise<FootprintGeoJson> {
    if (city.localGeoJsonPath) {
      const path = this.resolveCachePath(city.localGeoJsonPath);
      try {
        return withCityMetadata(parseGeoJson(await readFile(path, 'utf8')), city);
      } catch (error) {
        if (error instanceof FootprintGeoError) throw error;
        throw new FootprintGeoError(
          'GEO_BOUNDARY_UNAVAILABLE',
          'Local footprint boundary is unavailable',
        );
      }
    }

    if (city.geoProvider === 'fixture') return createFixtureBoundary(city);

    const cached = await this.readCachedBoundary(city);
    if (cached) return withCityMetadata(cached, city);

    let result: FootprintGeoJson;
    switch (city.geoProvider) {
      case 'world-geojson':
        result = await this.resolveWorldBoundary(city);
        break;
      case 'cn-atlas':
        result = await this.resolveChinaBoundary(city);
        break;
      case 'japan-prefecture':
        result = await this.resolveJapanBoundary(city);
        break;
      case 'local':
        throw new FootprintGeoError(
          'GEO_BOUNDARY_NOT_CONFIGURED',
          'A local GeoJSON path is required for the local provider',
        );
      default:
        throw new FootprintGeoError(
          'UNSUPPORTED_GEO_PROVIDER',
          `Unsupported footprint geo provider: ${city.geoProvider}`,
        );
    }

    await this.writeCachedBoundary(city, result);
    return result;
  }

  private async resolveWorldBoundary(city: FootprintGeoCity) {
    const source = await this.fetchJson(
      'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json',
    );
    const features = source.features.filter((feature) => {
      const properties = feature.properties ?? {};
      const code = [properties.ISO_A2, properties.iso_a2, properties.ISO_A2_EH]
        .find((value) => typeof value === 'string')
        ?.toUpperCase();
      const name = [properties.name, properties.NAME, properties.ADMIN].find(
        (value) => typeof value === 'string',
      );
      return code === city.countryCode.toUpperCase() || name === city.countryName;
    });
    if (!features.length)
      throw new FootprintGeoError('GEO_BOUNDARY_NOT_FOUND', 'Country boundary not found');
    return withCityMetadata({ type: 'FeatureCollection', features }, city);
  }

  private async resolveChinaBoundary(city: FootprintGeoCity) {
    const source = await this.fetchJson('https://unpkg.com/cn-atlas/prefectures.json');
    const features = source.features.filter((feature) => matchesChinaFeature(feature, city));
    if (!features.length)
      throw new FootprintGeoError('GEO_BOUNDARY_NOT_FOUND', 'China city boundary not found');
    return withCityMetadata({ type: 'FeatureCollection', features }, city);
  }

  private async resolveJapanBoundary(city: FootprintGeoCity) {
    if (!city.geoCode) {
      throw new FootprintGeoError('GEO_BOUNDARY_NOT_CONFIGURED', 'A prefecture code is required');
    }
    const source = await this.fetchJson(
      `https://raw.githubusercontent.com/amay077/JapanPrefGeoJson/master/prefs/${encodeURIComponent(city.geoCode)}.geojson`,
    );
    return withCityMetadata(source, city);
  }

  private async fetchJson(url: string) {
    let response: Response;
    try {
      response = await this.fetcher(url, { signal: AbortSignal.timeout(15_000) });
    } catch {
      throw new FootprintGeoError(
        'GEO_BOUNDARY_UNAVAILABLE',
        'Footprint boundary provider is unavailable',
      );
    }
    if (!response.ok) {
      throw new FootprintGeoError(
        'GEO_BOUNDARY_UNAVAILABLE',
        'Footprint boundary provider returned an error',
      );
    }
    return parseGeoJson(await response.text());
  }

  private async readCachedBoundary(city: FootprintGeoCity) {
    try {
      return parseGeoJson(await readFile(this.resolveCachePath(cacheFileName(city)), 'utf8'));
    } catch {
      return null;
    }
  }

  private async writeCachedBoundary(city: FootprintGeoCity, data: FootprintGeoJson) {
    try {
      await mkdir(this.cacheDir, { recursive: true });
      await writeFile(this.resolveCachePath(cacheFileName(city)), JSON.stringify(data), 'utf8');
    } catch {
      // A provider response is still valid when the optional runtime cache is not writable.
    }
  }

  private resolveCachePath(filePath: string) {
    const candidate = resolve(
      this.cacheDir,
      isAbsolute(filePath) ? relative(this.cacheDir, filePath) : filePath,
    );
    const relativePath = relative(this.cacheDir, candidate);
    if (
      !relativePath ||
      relativePath === '..' ||
      relativePath.startsWith(`..${sep}`) ||
      isAbsolute(relativePath) ||
      relativePath.split(/[\\/]/).includes('..')
    ) {
      throw new FootprintGeoError(
        'INVALID_GEO_CACHE_PATH',
        'GeoJSON path is outside the cache directory',
      );
    }
    return candidate;
  }
}

function cacheFileName(city: FootprintGeoCity) {
  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify({
        countryCode: city.countryCode,
        countryName: city.countryName,
        cityName: city.cityName,
        geoProvider: city.geoProvider,
        geoCode: city.geoCode,
      }),
    )
    .digest('hex')
    .slice(0, 16);
  return `${city.slug}.${fingerprint}.geojson`;
}

export function createFixtureBoundary(city: FootprintGeoCity): FootprintGeoJson {
  const coordinates = (city.geoCode ?? '').split(',');
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new FootprintGeoError(
      'GEO_BOUNDARY_NOT_CONFIGURED',
      'Fixture provider requires lng,lat coordinates',
    );
  }
  const centerLongitude = longitude;
  const centerLatitude = latitude;
  const radius = 0.16;
  return withCityMetadata(
    {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [centerLongitude - radius, centerLatitude - radius],
                [centerLongitude + radius, centerLatitude - radius],
                [centerLongitude + radius, centerLatitude + radius],
                [centerLongitude - radius, centerLatitude + radius],
                [centerLongitude - radius, centerLatitude - radius],
              ],
            ],
          },
          properties: null,
        },
      ],
    },
    city,
  );
}

function matchesChinaFeature(feature: FootprintGeoJsonFeature, city: FootprintGeoCity) {
  const properties = feature.properties ?? {};
  const values = Object.values(properties).filter((value): value is string | number => {
    return typeof value === 'string' || typeof value === 'number';
  });
  const target = [city.geoCode, city.cityName].filter(Boolean).map((value) => String(value));
  return values.some((value) => target.includes(String(value)));
}

function withCityMetadata(data: FootprintGeoJson, city: FootprintGeoCity): FootprintGeoJson {
  return {
    type: 'FeatureCollection',
    features: data.features.map((feature) => ({
      ...feature,
      properties: { ...(feature.properties ?? {}), slug: city.slug, cityName: city.cityName },
    })),
  };
}

function parseGeoJson(value: string): FootprintGeoJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new FootprintGeoError('INVALID_GEOJSON', 'GeoJSON content is invalid');
  }
  if (!isFootprintGeoJson(parsed)) {
    if (isFootprintGeoJsonFeature(parsed)) {
      return { type: 'FeatureCollection', features: [parsed] };
    }
    throw new FootprintGeoError(
      'INVALID_GEOJSON',
      'GeoJSON must be a FeatureCollection or Feature',
    );
  }
  return parsed;
}

function isFootprintGeoJsonFeature(value: unknown): value is FootprintGeoJsonFeature {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { type?: unknown; geometry?: unknown };
  return (
    candidate.type === 'Feature' &&
    (candidate.geometry === null || typeof candidate.geometry === 'object')
  );
}

function isFootprintGeoJson(value: unknown): value is FootprintGeoJson {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { type?: unknown; features?: unknown };
  return (
    candidate.type === 'FeatureCollection' &&
    Array.isArray(candidate.features) &&
    candidate.features.every((feature) => {
      if (!feature || typeof feature !== 'object') return false;
      const item = feature as { type?: unknown; geometry?: unknown };
      return (
        item.type === 'Feature' && (item.geometry === null || typeof item.geometry === 'object')
      );
    })
  );
}
