import type { PrismaClient } from '../generated/prisma/client';

import { ONLINE_WINDOW_MS } from '../utils/stats';

export class StatsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async recordVisit(path: string, visitorHash: string, now: Date) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    await this.prisma.$transaction(async (transaction) => {
      await transaction.pageViewDaily.upsert({
        where: { date_path: { date, path } },
        create: { date, path, views: BigInt(1) },
        update: { views: { increment: BigInt(1) } },
      });
      await transaction.visitorActivity.upsert({
        where: { visitorHash },
        create: { visitorHash, lastSeenAt: now },
        update: { lastSeenAt: now },
      });
    });
  }

  async getPublicStats(now: Date) {
    const pageViews = await this.prisma.pageViewDaily.aggregate({ _sum: { views: true } });
    const onlineVisitors = await this.prisma.visitorActivity.count({
      where: { lastSeenAt: { gte: new Date(now.getTime() - ONLINE_WINDOW_MS) } },
    });
    const totalPosts = await this.prisma.post.count({ where: { status: 'PUBLISHED' } });
    const totalCategories = await this.prisma.postCategory.count({ where: { visible: true } });
    const totalWords = await this.prisma.post.aggregate({
      where: { status: 'PUBLISHED' },
      _sum: { wordCount: true },
    });
    const siteProfile = await this.prisma.siteProfile.findFirst({ select: { foundedAt: true } });

    return {
      totalPageViews: pageViews._sum.views ?? BigInt(0),
      onlineVisitors,
      totalPosts,
      totalCategories,
      totalWords: totalWords._sum.wordCount ?? 0,
      foundedAt: siteProfile?.foundedAt ?? null,
    };
  }
}
