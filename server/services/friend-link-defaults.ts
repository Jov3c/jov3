import type { PrismaClient } from '../generated/prisma/client';

const DEFAULT_FRIEND_LINKS = [
  {
    name: 'FeiTwnd',
    url: 'https://feitwnd.cc',
    description: '技术、生活与胡思乱想。',
    sortOrder: 10,
  },
  {
    name: 'Mori',
    url: 'https://mori.example.com',
    description: '记录设计、摄影和一点点日常。',
    sortOrder: 20,
  },
  {
    name: 'Northwind',
    url: 'https://northwind.example.com',
    description: '写代码，也写一些关于产品的想法。',
    sortOrder: 30,
  },
  {
    name: 'Aster',
    url: 'https://aster.example.com',
    description: 'Web、AI 和长期主义。',
    sortOrder: 40,
  },
  {
    name: 'Haru',
    url: 'https://haru.example.com',
    description: '一个很慢很慢更新的小站。',
    sortOrder: 50,
  },
  {
    name: 'Sora',
    url: 'https://sora.example.com',
    description: '一些技术笔记和生活碎片。',
    sortOrder: 60,
  },
] as const;

export async function seedFriendLinkDefaults(prisma: PrismaClient) {
  if ((await prisma.friendLink.count()) > 0) return false;
  await prisma.friendLink.createMany({
    data: DEFAULT_FRIEND_LINKS.map((link) => ({
      ...link,
      logoMediaId: null,
      contactEmail: null,
      applicantNote: null,
      source: 'ADMIN' as const,
      status: 'PUBLISHED' as const,
      verifiedAt: null,
      visible: true,
    })),
  });
  return true;
}
