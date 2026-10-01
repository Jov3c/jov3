import { describe, expect, it, vi } from 'vitest';

import { HomeService } from '../../server/services/home-service';

function configuredRepository() {
  return {
    ensureDefaults: vi.fn(),
    findSiteProfile: vi.fn().mockResolvedValue({
      id: 'site',
      siteTitle: 'Jov3',
      siteDescription: 'A site',
      foundedAt: new Date('2026-01-01T00:00:00.000Z'),
      publicContactEmail: null,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    findHomeProfile: vi.fn().mockResolvedValue({
      id: 'home',
      nickname: 'Jov3',
      role: 'Builder',
      intro: 'Building.',
      avatarMediaId: null,
      avatarMedia: null,
      statusText: null,
      statusVisible: false,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    listHomeEntries: vi.fn().mockResolvedValue([]),
    listSocialLinks: vi.fn().mockResolvedValue([]),
    countVisibleHomeEntries: vi.fn().mockResolvedValue(0),
    createHomeEntry: vi.fn().mockResolvedValue({
      id: 'entry',
      title: 'Projects',
      description: 'Projects',
      icon: null,
      url: '/projects',
      targetType: 'INTERNAL',
      openNewTab: false,
      sortOrder: 10,
      visible: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
  };
}

describe('home service', () => {
  it('does not write defaults while reading public home data', async () => {
    const repository = configuredRepository();
    const result = await new HomeService(repository as never).getPublicHome();

    expect(result.entries).toEqual([]);
    expect(repository.ensureDefaults).not.toHaveBeenCalled();
  });

  it('rejects a ninth visible entry instead of silently truncating public home', async () => {
    const repository = configuredRepository();
    repository.countVisibleHomeEntries.mockResolvedValue(8);

    await expect(
      new HomeService(repository as never).createEntry({
        title: 'Ninth',
        description: 'Should be rejected',
        icon: null,
        url: '/projects',
        targetType: 'INTERNAL',
        openNewTab: false,
        sortOrder: 90,
        visible: true,
      }),
    ).rejects.toMatchObject({ code: 'HOME_ENTRY_LIMIT_REACHED' });
    expect(repository.createHomeEntry).not.toHaveBeenCalled();
  });
});
