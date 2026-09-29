import type { PrismaClient } from '../generated/prisma/client';

const DEFAULT_MESSAGES = [
  {
    nickname: 'Mori',
    email: 'mori@example.com',
    content: '这个站的整体节奏很舒服，项目页也很好逛。',
    createdAt: '2026-09-22T18:42:00+08:00',
  },
  {
    nickname: 'Northwind',
    email: 'northwind@example.com',
    content: '友链页可以申请加入吗？之后如果开放的话我想交换一下。',
    createdAt: '2026-09-18T12:16:00+08:00',
  },
  {
    nickname: 'Aster',
    email: 'aster@example.com',
    content: '路过留个脚印。Blog 右边的网站信息很有意思。',
    createdAt: '2026-09-11T09:35:00+08:00',
  },
] as const;

export async function seedCommunityDefaults(prisma: PrismaClient) {
  if ((await prisma.message.count()) > 0) return false;

  const messages = [];
  for (const message of DEFAULT_MESSAGES) {
    const createdAt = new Date(message.createdAt);
    messages.push(
      await prisma.message.create({
        data: {
          nickname: message.nickname,
          email: message.email,
          content: message.content,
          status: 'PUBLISHED',
          authorType: 'VISITOR',
          verifiedAt: createdAt,
          ipHash: null,
          createdAt,
        },
      }),
    );
  }

  await prisma.message.create({
    data: {
      parentId: messages[0]!.id,
      nickname: 'Jov3',
      email: null,
      content: '谢谢，后面还会继续把几个子页面统一起来。',
      status: 'PUBLISHED',
      authorType: 'ADMIN',
      verifiedAt: new Date('2026-09-22T22:10:00+08:00'),
      ipHash: null,
      createdAt: new Date('2026-09-22T22:10:00+08:00'),
    },
  });

  if ((await prisma.articleComment.count()) === 0) {
    const post = await prisma.post.findUnique({ where: { slug: 'server' } });
    if (post) {
      const createdAt = new Date('2026-09-23T09:20:00+08:00');
      const comment = await prisma.articleComment.create({
        data: {
          postId: post.id,
          nickname: 'Mori',
          email: 'mori@example.com',
          content: '把检查拆开之后确实更容易长期维护，感谢分享。',
          status: 'PUBLISHED',
          authorType: 'VISITOR',
          verifiedAt: createdAt,
          ipHash: null,
          createdAt,
        },
      });
      await prisma.articleComment.create({
        data: {
          postId: post.id,
          parentId: comment.id,
          nickname: 'Jov3',
          email: null,
          content: '谢谢，能让维护过程更可确认就是我想记录的部分。',
          status: 'PUBLISHED',
          authorType: 'ADMIN',
          verifiedAt: new Date('2026-09-23T10:05:00+08:00'),
          ipHash: null,
          createdAt: new Date('2026-09-23T10:05:00+08:00'),
        },
      });
    }
  }

  return true;
}
