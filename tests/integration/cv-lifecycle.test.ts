import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { CvRepository } from '../../server/repositories/cv-repository';
import { CvService } from '../../server/services/cv-service';
import { seedProjectDefaults } from '../../server/services/project-defaults';
import { createPrismaClient } from '../../server/utils/prisma';

const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);
const suffix = `${Date.now()}`;

describe('CV lifecycle', () => {
  const service = new CvService(new CvRepository(prisma));
  let profileId = '';
  let originalPublic = true;
  let originalProjectIds: string[] = [];
  let fixtureProjectId = '';

  beforeAll(async () => {
    await seedProjectDefaults(prisma);
    const profile = await prisma.cvProfile.findFirst({
      include: { projectRefs: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!profile) throw new Error('CV defaults were not seeded');
    profileId = profile.id;
    originalPublic = profile.isPublic;
    originalProjectIds = profile.projectRefs.map((ref) => ref.projectId);
  });

  afterAll(async () => {
    if (!profileId) return prisma.$disconnect();
    await service.updateProfile({ isPublic: originalPublic });
    await service.replaceProjects(originalProjectIds);
    if (fixtureProjectId) await prisma.project.delete({ where: { id: fixtureProjectId } });
    await prisma.$disconnect();
  });

  it('hides a private CV without deleting profile or experience data', async () => {
    const before = await service.getAdmin();
    await service.updateProfile({ isPublic: false });

    await expect(service.getPublic()).rejects.toMatchObject({ code: 'CV_NOT_PUBLIC' });
    await expect(service.getAdmin()).resolves.toMatchObject({
      isPublic: false,
      name: before.name,
      experiences: before.experiences,
    });
  });

  it('resolves a renamed Project through the stored project relation', async () => {
    await service.updateProfile({ isPublic: true });
    const project = await prisma.project.create({
      data: {
        slug: `stage-nine-${suffix}`,
        name: 'Stage Nine Original',
        summary: 'CV relation fixture',
        status: 'ACTIVE',
        techStack: ['Test'],
        githubUrl: null,
        demoUrl: null,
        readmeMarkdown: '# Fixture',
        sortOrder: 999,
        visible: true,
      },
    });
    fixtureProjectId = project.id;
    await service.replaceProjects([project.id]);
    await prisma.project.update({
      where: { id: project.id },
      data: { name: 'Stage Nine Renamed', slug: `stage-nine-renamed-${suffix}` },
    });

    await expect(service.getPublic()).resolves.toMatchObject({
      projects: [
        expect.objectContaining({
          name: 'Stage Nine Renamed',
          slug: `stage-nine-renamed-${suffix}`,
        }),
      ],
    });
  });
});
