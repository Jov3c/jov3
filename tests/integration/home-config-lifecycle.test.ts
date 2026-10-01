import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HomeRepository } from '../../server/repositories/home-repository';
import { ensureHomeDefaults } from '../../server/services/home-defaults';
import { HomeService } from '../../server/services/home-service';
import { createPrismaClient } from '../../server/utils/prisma';

const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);

describe('home configuration lifecycle', () => {
  const service = new HomeService(new HomeRepository(prisma));

  beforeAll(async () => {
    await ensureHomeDefaults(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('keeps public home data sorted and excludes hidden entries and links', async () => {
    const createdEntry = await service.createEntry({
      title: 'Stage 04 integration entry',
      description: 'Created by the home configuration lifecycle test.',
      icon: '◇',
      url: '/projects',
      targetType: 'INTERNAL',
      openNewTab: false,
      sortOrder: 1,
      visible: true,
    });
    const hiddenEntry = await service.createEntry({
      title: 'Hidden stage entry',
      description: 'This should never reach the public API.',
      icon: '×',
      url: '/blog',
      targetType: 'INTERNAL',
      openNewTab: false,
      sortOrder: 2,
      visible: false,
    });
    const createdSocial = await service.createSocialLink({
      name: 'Stage 04 social',
      icon: 'test',
      url: 'https://example.com/stage-04',
      sortOrder: 1,
      visible: true,
    });

    try {
      const publicHome = await service.getPublicHome();
      expect(publicHome.entries[0]?.title).toBe('Stage 04 integration entry');
      expect(publicHome.entries.some((entry) => entry.title === hiddenEntry.title)).toBe(false);
      expect(publicHome.socialLinks[0]?.name).toBe('Stage 04 social');
    } finally {
      await service.deleteEntry(createdEntry.id);
      await service.deleteEntry(hiddenEntry.id);
      await service.deleteSocialLink(createdSocial.id);
    }
  });

  it('rejects unsafe entry URLs before they reach the database', async () => {
    await expect(
      service.createEntry({
        title: 'Unsafe',
        description: 'Should be rejected',
        icon: null,
        url: 'javascript:alert(1)',
        targetType: 'EXTERNAL',
        openNewTab: true,
        sortOrder: 999,
        visible: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_HOME_URL' });
  });

  it('rejects the ninth visible homepage entry with a clear conflict', async () => {
    const createdIds: string[] = [];
    const visibleCount = await prisma.homeEntry.count({ where: { visible: true } });
    try {
      for (let index = visibleCount; index < 8; index += 1) {
        const entry = await service.createEntry({
          title: `Visible capacity ${index}`,
          description: 'A visible entry used to verify the homepage limit.',
          icon: null,
          url: '/projects',
          targetType: 'INTERNAL',
          openNewTab: false,
          sortOrder: 10_000 + index,
          visible: true,
        });
        createdIds.push(entry.id);
      }

      await expect(
        service.createEntry({
          title: 'Visible capacity overflow',
          description: 'This entry must not be silently hidden.',
          icon: null,
          url: '/projects',
          targetType: 'INTERNAL',
          openNewTab: false,
          sortOrder: 20_000,
          visible: true,
        }),
      ).rejects.toMatchObject({ code: 'HOME_ENTRY_LIMIT_REACHED' });
    } finally {
      for (const id of createdIds) await service.deleteEntry(id);
    }
  });
});
