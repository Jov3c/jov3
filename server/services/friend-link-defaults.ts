import type { PrismaClient } from '../generated/prisma/client';

const DEFAULT_FRIEND_LINKS = [
  {
    name: 'FeiTwnd',
    url: 'https://feitwnd.cc',
    description: '记录技术、设计与生活的个人网站。',
    sortOrder: 10,
  },
  {
    name: 'Mori',
    url: 'https://mori.example.com',
    description: '在文字、影像和日常之间慢慢更新。',
    sortOrder: 20,
  },
  {
    name: 'Northwind',
    url: 'https://northwind.example.com',
    description: '开发、阅读，以及一些不急着完成的想法。',
    sortOrder: 30,
  },
  {
    name: 'Aster',
    url: 'https://aster.example.com',
    description: '独立开发和产品观察。',
    sortOrder: 40,
  },
  {
    name: 'Haru',
    url: 'https://haru.example.com',
    description: '影像、设计与日常灵感。',
    sortOrder: 50,
  },
  {
    name: 'Sora',
    url: 'https://sora.example.com',
    description: '开放网络中的一小块自留地。',
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
