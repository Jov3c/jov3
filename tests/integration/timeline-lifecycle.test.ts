import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { TimelineRepository } from '../../server/repositories/timeline-repository';
import { TimelineService } from '../../server/services/timeline-service';
import { seedProjectDefaults } from '../../server/services/project-defaults';
import { createPrismaClient } from '../../server/utils/prisma';

const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);
const suffix = `${Date.now()}`;

describe('Timeline lifecycle', () => {
  const service = new TimelineService(new TimelineRepository(prisma));
  let entryId = '';
  let projectId = '';

  beforeAll(async () => {
    await seedProjectDefaults(prisma);
    const project = await prisma.project.create({
      data: {
        slug: `timeline-project-${suffix}`,
        name: 'Timeline Project',
        summary: 'Timeline relation fixture',
        status: 'ACTIVE',
        techStack: ['Test'],
        githubUrl: null,
        demoUrl: null,
        readmeMarkdown: '# Timeline',
        sortOrder: 999,
        visible: true,
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    if (entryId) await service.delete(entryId);
    if (projectId) await prisma.project.delete({ where: { id: projectId } });
    await prisma.$disconnect();
  });

  it('persists precision, links, and project refs while public output follows project renames', async () => {
    const created = await service.create({
      eventDate: '2026-09-29',
      datePrecision: 'MONTH',
      title: 'Timeline fixture',
      bodyMarkdown: '# A chapter\n\n- Keep moving',
      sortOrder: 900,
      visible: true,
      mediaIds: [],
      links: [{ label: 'Reference', url: 'https://example.com/reference', sortOrder: 0 }],
      projectIds: [projectId],
    });
    entryId = created.id;

    await prisma.project.update({
      where: { id: projectId },
      data: { name: 'Timeline Project Renamed', slug: `timeline-project-renamed-${suffix}` },
    });

    await expect(service.listPublic()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: entryId,
          dateLabel: '2026.09',
          bodyHtml: expect.stringContaining('<h1>A chapter</h1>'),
          links: [expect.objectContaining({ label: 'Reference' })],
          projects: [
            expect.objectContaining({
              name: 'Timeline Project Renamed',
              slug: `timeline-project-renamed-${suffix}`,
            }),
          ],
        }),
      ]),
    );
  });

  it('hides invisible entries from public output but keeps them in admin output', async () => {
    await service.update(entryId, { visible: false });

    await expect(service.listPublic()).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: entryId })]),
    );
    await expect(service.listAdmin()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: entryId, visible: false })]),
    );
  });
});
