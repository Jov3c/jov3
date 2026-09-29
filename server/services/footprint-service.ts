import { deriveFootprintVisited } from '../../shared/footprint';
import {
  footprintCitySchema,
  footprintMemorySchema,
  type FootprintCityInput,
  type FootprintCityUpdateInput,
  type FootprintMemoryInput,
  type FootprintMemoryUpdateInput,
} from '../../shared/schemas/footprint';
import type { FootprintRepository } from '../repositories/footprint-repository';

export class FootprintError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'FootprintError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

type PublicCitySummary = Awaited<ReturnType<FootprintRepository['listPublicCities']>>[number];
type PublicCity = NonNullable<Awaited<ReturnType<FootprintRepository['findPublicCityBySlug']>>>;
type AdminCity = Awaited<ReturnType<FootprintRepository['listAdminCities']>>[number];
type AdminMemory = Awaited<ReturnType<FootprintRepository['listAdminMemories']>>[number];

export class FootprintService {
  constructor(private readonly repository: FootprintRepository) {}

  async listPublicCities() {
    return (await this.repository.listPublicCities()).map(toPublicCitySummary);
  }

  async getPublicCity(slug: string) {
    const city = await this.repository.findPublicCityBySlug(slug);
    if (!city)
      throw new FootprintError(404, 'FOOTPRINT_CITY_NOT_FOUND', 'Footprint city not found');
    return toPublicCity(city);
  }

  async getBoundaryCity(slug: string) {
    const city = await this.repository.findCityBoundaryBySlug(slug);
    if (!city)
      throw new FootprintError(404, 'FOOTPRINT_CITY_NOT_FOUND', 'Footprint city not found');
    return city;
  }

  async listAdminCities() {
    return (await this.repository.listAdminCities()).map(toAdminCity);
  }

  async listAdminMemories(cityId?: string) {
    return (await this.repository.listAdminMemories(cityId)).map(toAdminMemory);
  }

  async createCity(input: FootprintCityInput) {
    const parsed = footprintCitySchema.safeParse(input);
    if (!parsed.success) throw invalidFootprintError('INVALID_FOOTPRINT_CITY');
    const city = await this.persistCity(() => this.repository.createCity(parsed.data));
    return toAdminCity(city);
  }

  async updateCity(id: string, input: FootprintCityUpdateInput) {
    const current = await this.requireCity(id);
    const parsed = footprintCitySchema.safeParse({
      slug: current.slug,
      countryCode: current.countryCode,
      countryName: current.countryName,
      cityName: current.cityName,
      regionName: current.regionName,
      geoProvider: current.geoProvider,
      geoCode: current.geoCode,
      localGeoJsonPath: current.localGeoJsonPath,
      sortOrder: current.sortOrder,
      ...input,
    });
    if (!parsed.success) throw invalidFootprintError('INVALID_FOOTPRINT_CITY');
    return toAdminCity(await this.persistCity(() => this.repository.updateCity(id, parsed.data)));
  }

  async deleteCity(id: string) {
    await this.requireCity(id);
    await this.repository.deleteCity(id);
    return { deleted: true };
  }

  async createMemory(input: FootprintMemoryInput) {
    const parsed = footprintMemorySchema.safeParse(input);
    if (!parsed.success) throw invalidFootprintError('INVALID_FOOTPRINT_MEMORY');
    await this.ensureRelations(parsed.data);
    const memory = await this.repository.createMemory(parsed.data);
    if (!memory)
      throw new FootprintError(503, 'FOOTPRINT_MEMORY_NOT_CREATED', 'Memory was not created');
    return toAdminMemory(memory);
  }

  async updateMemory(id: string, input: FootprintMemoryUpdateInput) {
    const current = await this.requireMemory(id);
    const parsed = footprintMemorySchema.safeParse({
      cityId: current.cityId,
      title: current.title,
      body: current.body,
      occurredOn: formatDate(current.occurredOn),
      sortOrder: current.sortOrder,
      visible: current.visible,
      mediaIds: current.media.map((item) => item.media.id),
      ...input,
    });
    if (!parsed.success) throw invalidFootprintError('INVALID_FOOTPRINT_MEMORY');
    await this.ensureRelations(parsed.data);
    const memory = await this.repository.updateMemory(id, parsed.data);
    if (!memory) throw new FootprintError(404, 'FOOTPRINT_MEMORY_NOT_FOUND', 'Memory not found');
    return toAdminMemory(memory);
  }

  async deleteMemory(id: string) {
    await this.requireMemory(id);
    await this.repository.deleteMemory(id);
    return { deleted: true };
  }

  private async requireCity(id: string) {
    const city = await this.repository.findCityById(id);
    if (!city)
      throw new FootprintError(404, 'FOOTPRINT_CITY_NOT_FOUND', 'Footprint city not found');
    return city;
  }

  private async requireMemory(id: string) {
    const memory = await this.repository.findMemoryById(id);
    if (!memory) throw new FootprintError(404, 'FOOTPRINT_MEMORY_NOT_FOUND', 'Memory not found');
    return memory;
  }

  private async ensureRelations(input: FootprintMemoryInput) {
    await this.requireCity(input.cityId);
    const media = await this.repository.findMediaByIds(input.mediaIds);
    if (media.length !== input.mediaIds.length) {
      throw new FootprintError(
        400,
        'MEDIA_NOT_FOUND',
        'One or more memory media assets were not found',
      );
    }
  }

  private async persistCity<T>(action: () => Promise<T>) {
    try {
      return await action();
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new FootprintError(
          409,
          'FOOTPRINT_CITY_SLUG_CONFLICT',
          'City slug is already in use',
        );
      }
      throw error;
    }
  }
}

export function footprintApiError(error: unknown) {
  if (error instanceof FootprintError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  return null;
}

function toPublicCitySummary(city: PublicCitySummary) {
  const memoryCount = city.memories.length;
  return {
    id: city.id,
    slug: city.slug,
    countryCode: city.countryCode,
    countryName: city.countryName,
    cityName: city.cityName,
    regionName: city.regionName,
    memoryCount,
    visited: deriveFootprintVisited(memoryCount),
    boundaryUrl: `/api/v1/public/footprint/cities/${city.slug}/boundary`,
  };
}

function toPublicCity(city: PublicCity) {
  return {
    ...toPublicCitySummary(city),
    memories: city.memories.map((memory) => ({
      id: memory.id,
      title: memory.title,
      body: memory.body,
      occurredOn: formatDate(memory.occurredOn),
      sortOrder: memory.sortOrder,
      media: memory.media.map((item) => ({
        id: item.media.id,
        publicUrl: item.media.publicUrl,
        altText: item.media.altText,
        sortOrder: item.sortOrder,
      })),
    })),
  };
}

function toAdminCity(city: AdminCity) {
  const visibleMemoryCount = city.memories.filter((memory) => memory.visible).length;
  return {
    id: city.id,
    slug: city.slug,
    countryCode: city.countryCode,
    countryName: city.countryName,
    cityName: city.cityName,
    regionName: city.regionName,
    geoProvider: city.geoProvider,
    geoCode: city.geoCode,
    localGeoJsonPath: city.localGeoJsonPath,
    sortOrder: city.sortOrder,
    memoryCount: city.memories.length,
    visibleMemoryCount,
    visited: deriveFootprintVisited(visibleMemoryCount),
    createdAt: city.createdAt.toISOString(),
    updatedAt: city.updatedAt.toISOString(),
    memories: city.memories.map(toAdminMemory),
  };
}

function toAdminMemory(memory: AdminMemory) {
  return {
    id: memory.id,
    cityId: memory.cityId,
    city: memory.city,
    title: memory.title,
    body: memory.body,
    occurredOn: formatDate(memory.occurredOn),
    sortOrder: memory.sortOrder,
    visible: memory.visible,
    mediaIds: memory.media.map((item) => item.media.id),
    media: memory.media.map((item) => ({
      id: item.media.id,
      publicUrl: item.media.publicUrl,
      altText: item.media.altText,
      sortOrder: item.sortOrder,
    })),
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
  };
}

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function invalidFootprintError(code: 'INVALID_FOOTPRINT_CITY' | 'INVALID_FOOTPRINT_MEMORY') {
  return new FootprintError(400, code, 'Footprint fields are invalid');
}
