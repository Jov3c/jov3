import type { Prisma, PrismaClient } from '../generated/prisma/client';

import type { FootprintCityInput, FootprintMemoryInput } from '../../shared/schemas/footprint';

const mediaSelect = { id: true, publicUrl: true, altText: true } as const;
const citySelect = {
  id: true,
  slug: true,
  countryCode: true,
  countryName: true,
  cityName: true,
  regionName: true,
} as const;

const publicMemoryInclude = {
  media: {
    orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
    include: { media: { select: mediaSelect } },
  },
};

const adminMemoryInclude = {
  ...publicMemoryInclude,
  city: { select: citySelect },
};

const adminCityInclude = {
  memories: {
    orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
    include: { ...publicMemoryInclude, city: { select: citySelect } },
  },
};

export class FootprintRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listPublicCities() {
    return this.prisma.footprintCity.findMany({
      orderBy: [{ sortOrder: 'asc' }, { countryCode: 'asc' }, { cityName: 'asc' }],
      include: { memories: { where: { visible: true }, select: { id: true } } },
    });
  }

  findPublicCityBySlug(slug: string) {
    return this.prisma.footprintCity.findUnique({
      where: { slug },
      include: {
        memories: {
          where: { visible: true },
          orderBy: [{ occurredOn: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
          include: publicMemoryInclude,
        },
      },
    });
  }

  findCityBoundaryBySlug(slug: string) {
    return this.prisma.footprintCity.findUnique({
      where: { slug },
      select: {
        slug: true,
        countryCode: true,
        countryName: true,
        cityName: true,
        geoProvider: true,
        geoCode: true,
        localGeoJsonPath: true,
      },
    });
  }

  listAdminCities() {
    return this.prisma.footprintCity.findMany({
      orderBy: [{ sortOrder: 'asc' }, { countryCode: 'asc' }, { cityName: 'asc' }],
      include: adminCityInclude,
    });
  }

  findCityById(id: string) {
    return this.prisma.footprintCity.findUnique({
      where: { id },
      include: adminCityInclude,
    });
  }

  createCity(input: FootprintCityInput) {
    return this.prisma.footprintCity.create({
      data: {
        slug: input.slug,
        countryCode: input.countryCode,
        countryName: input.countryName,
        cityName: input.cityName,
        regionName: input.regionName,
        geoProvider: input.geoProvider,
        geoCode: input.geoCode,
        localGeoJsonPath: input.localGeoJsonPath,
        sortOrder: input.sortOrder,
      },
      include: adminCityInclude,
    });
  }

  updateCity(id: string, input: FootprintCityInput) {
    return this.prisma.footprintCity.update({
      where: { id },
      data: {
        slug: input.slug,
        countryCode: input.countryCode,
        countryName: input.countryName,
        cityName: input.cityName,
        regionName: input.regionName,
        geoProvider: input.geoProvider,
        geoCode: input.geoCode,
        localGeoJsonPath: input.localGeoJsonPath,
        sortOrder: input.sortOrder,
      },
      include: adminCityInclude,
    });
  }

  deleteCity(id: string) {
    return this.prisma.footprintCity.delete({ where: { id } });
  }

  listAdminMemories(cityId?: string) {
    return this.prisma.footprintMemory.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: [{ occurredOn: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      include: adminMemoryInclude,
    });
  }

  findMemoryById(id: string) {
    return this.prisma.footprintMemory.findUnique({
      where: { id },
      include: adminMemoryInclude,
    });
  }

  findMediaByIds(ids: string[]) {
    return this.prisma.mediaAsset.findMany({ where: { id: { in: ids } }, select: mediaSelect });
  }

  async createMemory(input: FootprintMemoryInput) {
    return this.prisma.$transaction(async (tx) => {
      const memory = await tx.footprintMemory.create({ data: toMemoryData(input) });
      await replaceMemoryMedia(tx, memory.id, input.mediaIds);
      return tx.footprintMemory.findUnique({
        where: { id: memory.id },
        include: adminMemoryInclude,
      });
    });
  }

  async updateMemory(id: string, input: FootprintMemoryInput) {
    return this.prisma.$transaction(async (tx) => {
      await tx.footprintMemory.update({ where: { id }, data: toMemoryData(input) });
      await replaceMemoryMedia(tx, id, input.mediaIds);
      return tx.footprintMemory.findUnique({ where: { id }, include: adminMemoryInclude });
    });
  }

  deleteMemory(id: string) {
    return this.prisma.footprintMemory.delete({ where: { id } });
  }
}

function toMemoryData(input: FootprintMemoryInput) {
  return {
    cityId: input.cityId,
    title: input.title,
    body: input.body,
    occurredOn: input.occurredOn ? new Date(`${input.occurredOn}T00:00:00.000Z`) : null,
    sortOrder: input.sortOrder,
    visible: input.visible,
  };
}

async function replaceMemoryMedia(
  tx: Prisma.TransactionClient,
  memoryId: string,
  mediaIds: string[],
) {
  await tx.footprintMemoryMedia.deleteMany({ where: { memoryId } });
  if (!mediaIds.length) return;
  await tx.footprintMemoryMedia.createMany({
    data: mediaIds.map((mediaId, index) => ({ memoryId, mediaId, sortOrder: index * 10 })),
  });
}
