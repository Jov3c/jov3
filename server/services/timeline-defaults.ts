import type { PrismaClient } from '../generated/prisma/client';

const DEFAULT_ENTRIES = [
  {
    eventDate: '2023-01-01',
    datePrecision: 'YEAR' as const,
    title: '第一次完整做完一个自己的项目',
    bodyMarkdown: '不是为了交作业，也不是为了工作任务，而是单纯因为自己觉得这个东西应该存在。',
    sortOrder: 10,
    projectSlugs: [] as string[],
  },
  {
    eventDate: '2024-01-01',
    datePrecision: 'YEAR' as const,
    title: '对“功能越多越好”产生怀疑',
    bodyMarkdown: '慢慢意识到，复杂并不等于完整。真正重要的是把主线留得足够清楚。',
    sortOrder: 20,
    projectSlugs: [] as string[],
  },
  {
    eventDate: '2025-01-01',
    datePrecision: 'YEAR' as const,
    title: '从工具，到产品',
    bodyMarkdown: '开始认真考虑交互、后台配置、长期维护和完整的使用体验，而不仅仅是让代码跑起来。',
    sortOrder: 30,
    projectSlugs: ['nexusflow', 'wechat-md'],
  },
  {
    eventDate: '2026-01-01',
    datePrecision: 'YEAR' as const,
    title: 'Signal / NexusFlow / WeChat-md',
    bodyMarkdown: '不同方向的项目，却越来越接近同一件事：减少复杂度，让信息、工具和体验更顺手。',
    sortOrder: 40,
    projectSlugs: ['signal-daily', 'nexusflow', 'wechat-md'],
  },
  {
    eventDate: '2026-12-31',
    datePrecision: 'DAY' as const,
    title: 'The story continues.',
    bodyMarkdown: '下一段轨迹，等它真的发生以后再写。',
    sortOrder: 50,
    projectSlugs: [],
  },
];

export async function seedTimelineDefaults(prisma: PrismaClient) {
  if (await prisma.timelineEntry.count()) return false;

  const projects = await prisma.project.findMany({
    where: { slug: { in: [...new Set(DEFAULT_ENTRIES.flatMap((entry) => entry.projectSlugs))] } },
    select: { id: true, slug: true },
  });
  const projectIds = new Map(projects.map((project) => [project.slug, project.id]));

  for (const entry of DEFAULT_ENTRIES) {
    const created = await prisma.timelineEntry.create({
      data: {
        eventDate: toDate(entry.eventDate),
        datePrecision: entry.datePrecision,
        title: entry.title,
        bodyMarkdown: entry.bodyMarkdown,
        sortOrder: entry.sortOrder,
        visible: true,
      },
    });
    const projectRefs = entry.projectSlugs
      .map((slug, index) => {
        const projectId = projectIds.get(slug);
        return projectId
          ? { timelineEntryId: created.id, projectId, sortOrder: (index + 1) * 10 }
          : null;
      })
      .filter(
        (item): item is { timelineEntryId: string; projectId: string; sortOrder: number } =>
          item !== null,
      );
    if (projectRefs.length) await prisma.timelineEntryProject.createMany({ data: projectRefs });
  }

  return true;
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
