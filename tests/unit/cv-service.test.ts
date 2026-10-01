import { describe, expect, it } from 'vitest';

import { CvService } from '../../server/services/cv-service';
import type { CvError } from '../../server/services/cv-service';

function createAggregate(isPublic = true) {
  return {
    id: '00000000-0000-4000-8000-000000000010',
    isPublic,
    name: '朱鹏 / Jov3',
    headline: 'AI Application',
    bio: 'Build useful systems.',
    location: 'Chengdu, China',
    website: 'https://jov3.cloud',
    statusText: 'Open to AI roles',
    statement: 'Keep building.',
    portraitMediaId: '00000000-0000-4000-8000-000000000011',
    portraitMedia: {
      id: '00000000-0000-4000-8000-000000000011',
      publicUrl: '/uploads/portrait.webp',
      altText: 'Jov3',
    },
    updatedAt: new Date('2026-09-29T00:00:00.000Z'),
    experiences: [
      {
        id: '00000000-0000-4000-8000-000000000012',
        company: 'JOV3',
        role: 'Builder',
        location: 'Chengdu',
        startDate: new Date('2025-06-01T00:00:00.000Z'),
        endDate: null,
        isCurrent: true,
        description: 'Build useful systems.',
        sortOrder: 10,
      },
    ],
    educations: [],
    skillGroups: [],
    projectRefs: [
      {
        id: '00000000-0000-4000-8000-000000000013',
        projectId: '00000000-0000-4000-8000-000000000014',
        sortOrder: 10,
        project: {
          id: '00000000-0000-4000-8000-000000000014',
          slug: 'signal-daily',
          name: 'Signal Daily',
          summary: 'A project.',
          status: 'ACTIVE',
          visible: true,
        },
      },
    ],
  };
}

function createRepository(aggregate: ReturnType<typeof createAggregate>) {
  return {
    getAggregate: async () => aggregate,
    findPublicContactEmail: async () => null,
    listPublicSocialLinks: async () => [],
  };
}

describe('CV service', () => {
  it('sanitizes the public DTO and keeps current project names', async () => {
    const service = new CvService(createRepository(createAggregate()) as never);

    const result = await service.getPublic();

    expect(result.profile).toMatchObject({ name: '朱鹏 / Jov3', website: 'https://jov3.cloud' });
    expect(result.profile).not.toHaveProperty('isPublic');
    expect(result.profile).not.toHaveProperty('portraitMediaId');
    expect(result.profile.portrait).toMatchObject({ publicUrl: '/uploads/portrait.webp' });
    expect(result.projects).toEqual([
      expect.objectContaining({ id: '00000000-0000-4000-8000-000000000014', name: 'Signal Daily' }),
    ]);
  });

  it('returns a 404 boundary when the CV is private without deleting content', async () => {
    const aggregate = createAggregate(false);
    const service = new CvService(createRepository(aggregate) as never);

    await expect(service.getPublic()).rejects.toMatchObject<CvError>({
      statusCode: 404,
      code: 'CV_NOT_PUBLIC',
    });
    await expect(service.getAdmin()).resolves.toMatchObject({
      isPublic: false,
      name: '朱鹏 / Jov3',
      experiences: [expect.objectContaining({ company: 'JOV3' })],
    });
  });

  it('includes configured contact and social links in the public profile', async () => {
    const aggregate = createAggregate();
    const repository = {
      ...createRepository(aggregate),
      findPublicContactEmail: async () => 'contact@jov3.cloud',
      listPublicSocialLinks: async () => [
        { id: 'github', name: 'GitHub', url: 'https://github.com/Jov3c' },
      ],
    };

    const result = await new CvService(repository as never).getPublic();

    expect(result.profile.contactEmail).toBe('contact@jov3.cloud');
    expect(result.profile.updatedAt).toBe('2026-09-29T00:00:00.000Z');
    expect(result.links).toEqual([
      { id: 'github', name: 'GitHub', url: 'https://github.com/Jov3c' },
    ]);
  });
});
