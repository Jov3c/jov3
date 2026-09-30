import type { PrismaClient } from '../generated/prisma/client';

export const DEFAULT_SITE_PROFILE = {
  siteTitle: 'Jov3 的个人网站',
  siteDescription: '在互联网上持续构建产品、工具与想法。',
  foundedAt: new Date('2026-01-01T00:00:00.000Z'),
};

export const DEFAULT_HOME_PROFILE = {
  nickname: 'Jov3',
  role: 'Product · AI · Developer',
  intro:
    'Building products, tools and ideas on the internet.\n一个关于项目、技术、学习与创造的个人入口。',
  statusText: 'currently building',
  statusVisible: true,
};

export const DEFAULT_HOME_ENTRIES = [
  {
    title: 'Projects',
    description: '正在做和已经完成的产品、工具与实验。',
    icon: '↗',
    url: '/projects',
    targetType: 'INTERNAL' as const,
    openNewTab: false,
    sortOrder: 10,
    visible: true,
  },
  {
    title: 'Blog',
    description: 'AI、产品与开发相关的长内容。',
    icon: '↗',
    url: '/blog',
    targetType: 'INTERNAL' as const,
    openNewTab: false,
    sortOrder: 20,
    visible: true,
  },
  {
    title: 'Notes',
    description: '持续更新的学习笔记和技术知识。',
    icon: '↗',
    url: '/blog/archive',
    targetType: 'INTERNAL' as const,
    openNewTab: false,
    sortOrder: 30,
    visible: true,
  },
  {
    title: 'About',
    description: '关于我、经历，以及我正在关注的事情。',
    icon: '↗',
    url: '/about/timeline',
    targetType: 'INTERNAL' as const,
    openNewTab: false,
    sortOrder: 40,
    visible: true,
  },
];

export const DEFAULT_SOCIAL_LINKS = [
  { name: 'GitHub', icon: 'github', url: 'https://github.com/Jov3c', sortOrder: 10, visible: true },
];

export async function ensureHomeDefaults(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(725531)`;

    const [siteProfile, homeProfile, homeEntryCount, socialLinkCount] = await Promise.all([
      tx.siteProfile.findFirst(),
      tx.homeProfile.findFirst(),
      tx.homeEntry.count(),
      tx.socialLink.count(),
    ]);

    if (!siteProfile) await tx.siteProfile.create({ data: DEFAULT_SITE_PROFILE });
    if (!homeProfile) await tx.homeProfile.create({ data: DEFAULT_HOME_PROFILE });
    if (homeEntryCount === 0) await tx.homeEntry.createMany({ data: DEFAULT_HOME_ENTRIES });
    if (socialLinkCount === 0) await tx.socialLink.createMany({ data: DEFAULT_SOCIAL_LINKS });
  });
}
