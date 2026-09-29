import { describe, expect, it } from 'vitest';

import { CvError, CvService } from '../../server/services/cv-service';

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

describe('CV service', () => {
  it('sanitizes the public DTO and keeps current project names', async () => {
    const service = new CvService({ getAggregate: async () => createAggregate() } as never);

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
    const service = new CvService({ getAggregate: async () => aggregate } as never);

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
});
