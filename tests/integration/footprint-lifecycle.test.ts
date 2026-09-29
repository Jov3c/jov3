import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FootprintRepository } from '../../server/repositories/footprint-repository';
import { FootprintService } from '../../server/services/footprint-service';
import { MediaRepository } from '../../server/repositories/media-repository';
import { createPrismaClient } from '../../server/utils/prisma';

const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);
const suffix = `${Date.now()}`;

describe('Footprint lifecycle', () => {
  const service = new FootprintService(new FootprintRepository(prisma));
  const mediaRepository = new MediaRepository(prisma);
  let cityId = '';
  let memoryId = '';
  let mediaId = '';

  beforeAll(async () => {
    const media = await prisma.mediaAsset.create({
      data: {
        originalName: `footprint-${suffix}.png`,
        storedName: `footprint-${suffix}.png`,
        mimeType: 'image/png',
        sizeBytes: BigInt(4),
        storagePath: `footprint/${suffix}.png`,
        publicUrl: `/uploads/footprint/${suffix}.png`,
        sha256: suffix.padEnd(64, '0').slice(0, 64),
        altText: 'Footprint fixture',
      },
    });
    mediaId = media.id;
  });

  afterAll(async () => {
    if (cityId) await prisma.footprintCity.delete({ where: { id: cityId } });
    if (mediaId) await prisma.mediaAsset.delete({ where: { id: mediaId } });
    await prisma.$disconnect();
  });

  it('derives visited state from visible memories and returns ordered media', async () => {
    const city = await service.createCity({
      slug: `stage-ten-${suffix}`,
      countryCode: 'CN',
      countryName: 'China',
      cityName: 'Stage Ten',
      regionName: null,
      geoProvider: 'fixture',
      geoCode: 'stage-ten',
      localGeoJsonPath: null,
      sortOrder: 900,
    });
    cityId = city.id;

    await expect(service.listPublicCities()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: city.slug, visited: false, memoryCount: 0 }),
      ]),
    );

    const memory = await service.createMemory({
      cityId,
      title: 'A fixture memory',
      body: 'A small city memory.',
      occurredOn: '2026-09-29',
      sortOrder: 0,
      visible: true,
      mediaIds: [mediaId],
    });
    memoryId = memory.id;
    await expect(mediaRepository.countReferences(mediaId)).resolves.toBe(1);

    await expect(service.listPublicCities()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: city.slug, visited: true, memoryCount: 1 }),
      ]),
    );
    await expect(service.getPublicCity(city.slug)).resolves.toMatchObject({
      slug: city.slug,
      visited: true,
      memories: [
        expect.objectContaining({
          title: 'A fixture memory',
          media: [
            expect.objectContaining({
              id: mediaId,
              publicUrl: `/uploads/footprint/${suffix}.png`,
            }),
          ],
        }),
      ],
    });
  });

  it('removes a city from visited state when its last memory is hidden or deleted', async () => {
    await service.updateMemory(memoryId, { visible: false });
    await expect(service.listPublicCities()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: `stage-ten-${suffix}`, visited: false, memoryCount: 0 }),
      ]),
    );

    await service.deleteMemory(memoryId);
    memoryId = '';
    await expect(mediaRepository.countReferences(mediaId)).resolves.toBe(0);
    await expect(service.getPublicCity(`stage-ten-${suffix}`)).resolves.toMatchObject({
      visited: false,
      memories: [],
    });
  });
});
