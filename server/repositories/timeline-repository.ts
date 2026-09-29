import type { Prisma, PrismaClient } from '../generated/prisma/client';

import type { TimelineEntryInput } from '../../shared/schemas/cv-timeline';

const mediaSelect = { id: true, publicUrl: true, altText: true } as const;
const projectSelect = {
  id: true,
  slug: true,
  name: true,
  summary: true,
  status: true,
  visible: true,
} as const;

const entryInclude = {
  media: {
    orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
    include: { media: { select: mediaSelect } },
  },
  links: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }] },
  projectRefs: {
    orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
    include: { project: { select: projectSelect } },
  },
};

export class TimelineRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listPublic() {
    return this.prisma.timelineEntry.findMany({
      where: { visible: true },
      orderBy: [{ eventDate: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      include: entryInclude,
    });
  }

  listAdmin() {
    return this.prisma.timelineEntry.findMany({
      orderBy: [{ eventDate: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      include: entryInclude,
    });
  }

  findById(id: string) {
    return this.prisma.timelineEntry.findUnique({ where: { id }, include: entryInclude });
  }

  findMediaByIds(ids: string[]) {
    return this.prisma.mediaAsset.findMany({ where: { id: { in: ids } }, select: mediaSelect });
  }

  findProjectsByIds(ids: string[]) {
    return this.prisma.project.findMany({ where: { id: { in: ids } }, select: projectSelect });
  }

  async create(input: TimelineEntryInput) {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.timelineEntry.create({ data: toEntryData(input) });
      await replaceRelations(tx, entry.id, input);
      return tx.timelineEntry.findUnique({ where: { id: entry.id }, include: entryInclude });
    });
  }

  async update(id: string, input: TimelineEntryInput) {
    return this.prisma.$transaction(async (tx) => {
      await tx.timelineEntry.update({ where: { id }, data: toEntryData(input) });
      await replaceRelations(tx, id, input);
      return tx.timelineEntry.findUnique({ where: { id }, include: entryInclude });
    });
  }

  delete(id: string) {
    return this.prisma.timelineEntry.delete({ where: { id } });
  }
}

async function replaceRelations(
  tx: Prisma.TransactionClient,
  timelineEntryId: string,
  input: TimelineEntryInput,
) {
  await tx.timelineEntryMedia.deleteMany({ where: { timelineEntryId } });
  await tx.timelineEntryLink.deleteMany({ where: { timelineEntryId } });
  await tx.timelineEntryProject.deleteMany({ where: { timelineEntryId } });

  if (input.mediaIds.length) {
    await tx.timelineEntryMedia.createMany({
      data: input.mediaIds.map((mediaId, index) => ({
        timelineEntryId,
        mediaId,
        sortOrder: index * 10,
      })),
    });
  }
  if (input.links.length) {
    await tx.timelineEntryLink.createMany({
      data: input.links.map((link) => ({ timelineEntryId, ...link })),
    });
  }
  if (input.projectIds.length) {
    await tx.timelineEntryProject.createMany({
      data: input.projectIds.map((projectId, index) => ({
        timelineEntryId,
        projectId,
        sortOrder: index * 10,
      })),
    });
  }
}

function toEntryData(input: TimelineEntryInput) {
  return {
    eventDate: new Date(`${input.eventDate}T00:00:00.000Z`),
    datePrecision: input.datePrecision,
    title: input.title,
    bodyMarkdown: input.bodyMarkdown,
    sortOrder: input.sortOrder,
    visible: input.visible,
  };
}
