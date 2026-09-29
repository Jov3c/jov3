import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ProjectRepository } from '../../server/repositories/project-repository';
import { ProjectService } from '../../server/services/project-service';
import { seedProjectDefaults } from '../../server/services/project-defaults';
import { createPrismaClient } from '../../server/utils/prisma';

const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);

describe('project lifecycle', () => {
  const service = new ProjectService(new ProjectRepository(prisma));
  const createdIds: string[] = [];
  let originalOrder: string[] = [];
  const suffix = `${Date.now()}`;

  beforeAll(async () => {
    await seedProjectDefaults(prisma);
    originalOrder = (await service.listAdmin()).items.map((project) => project.id);
  });

  afterAll(async () => {
    for (const id of createdIds) await service.delete(id);
    if (originalOrder.length) await service.reorder(originalOrder);
    await prisma.$disconnect();
  });

  it('creates, updates, hides, and renders a project from database content', async () => {
    const project = await service.create({
      slug: `stage-five-${suffix}`,
      name: 'Stage Five Project',
      summary: 'A project created by the Stage 05 lifecycle test.',
      status: 'BUILDING',
      techStack: ['Vue', 'TypeScript'],
      githubUrl: 'https://github.com/Jov3c/stage-five-project',
      demoUrl: null,
      readmeMarkdown: '# Stage Five\n\n- Database-backed README',
      sortOrder: 999,
      visible: true,
    });
    createdIds.push(project.id);

    await expect(service.getPublicBySlug(project.slug)).resolves.toMatchObject({
      name: 'Stage Five Project',
      readmeHtml: expect.stringContaining('<h1>Stage Five</h1>'),
    });

    await service.update(project.id, { visible: false, status: 'ACTIVE' });
    await expect(service.getPublicBySlug(project.slug)).rejects.toMatchObject({
      code: 'PROJECT_NOT_FOUND',
    });
    await expect(service.getAdminById(project.id)).resolves.toMatchObject({
      visible: false,
      status: 'ACTIVE',
      readmeMarkdown: '# Stage Five\n\n- Database-backed README',
    });
  });

  it('rejects duplicate slugs and unsafe project URLs', async () => {
    const project = await service.create({
      slug: `stage-five-conflict-${suffix}`,
      name: 'Stage Five Conflict',
      summary: 'Conflict fixture',
      status: 'DONE',
      techStack: ['Test'],
      githubUrl: null,
      demoUrl: null,
      readmeMarkdown: '# Conflict',
      sortOrder: 998,
      visible: true,
    });
    createdIds.push(project.id);

    await expect(
      service.create({
        slug: project.slug,
        name: 'Duplicate',
        summary: 'Duplicate fixture',
        status: 'DONE',
        techStack: [],
        githubUrl: null,
        demoUrl: null,
        readmeMarkdown: '# Duplicate',
        sortOrder: 997,
        visible: true,
      }),
    ).rejects.toMatchObject({ code: 'PROJECT_SLUG_CONFLICT' });

    await expect(
      service.create({
        slug: `stage-five-unsafe-${suffix}`,
        name: 'Unsafe',
        summary: 'Unsafe fixture',
        status: 'DONE',
        techStack: [],
        githubUrl: 'https://example.com/not-github',
        demoUrl: 'javascript:alert(1)',
        readmeMarkdown: '# Unsafe',
        sortOrder: 996,
        visible: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_GITHUB_URL' });
  });

  it('requires a complete unique order when reordering projects', async () => {
    const current = await service.listAdmin();
    await expect(
      service.reorder(current.items.slice(0, -1).map((project) => project.id)),
    ).rejects.toMatchObject({
      code: 'INVALID_PROJECT_ORDER',
    });

    const reversed = [...current.items].reverse().map((project) => project.id);
    const reordered = await service.reorder(reversed);
    expect(reordered.items.map((project) => project.id)).toEqual(reversed);
  });
});
