import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { StatsRepository } from '../../server/repositories/stats-repository';
import { StatsService } from '../../server/services/stats-service';
import { ensureHomeDefaults } from '../../server/services/home-defaults';
import { createPrismaClient } from '../../server/utils/prisma';

const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);

describe('site stats lifecycle', () => {
  const repository = new StatsRepository(prisma);
  const service = new StatsService(repository);
  const suffix = Date.now().toString();
  const visitorHash = 'a'.repeat(64);
  const otherVisitorHash = 'b'.repeat(64);
  const now = new Date('2099-01-01T12:00:00.000Z');

  beforeAll(async () => {
    await ensureHomeDefaults(prisma);
  });

  beforeEach(async () => {
    await prisma.visitorActivity.deleteMany({
      where: { visitorHash: { in: [visitorHash, otherVisitorHash] } },
    });
    await prisma.pageViewDaily.deleteMany({ where: { path: `/stage-eleven-${suffix}` } });
  });

  afterAll(async () => {
    await prisma.visitorActivity.deleteMany({
      where: { visitorHash: { in: [visitorHash, otherVisitorHash] } },
    });
    await prisma.pageViewDaily.deleteMany({ where: { path: `/stage-eleven-${suffix}` } });
    await prisma.$disconnect();
  });

  it('aggregates repeated visits by UTC day and counts recent unique visitors online', async () => {
    const path = `/stage-eleven-${suffix}`;
    await service.recordVisit(path, visitorHash, now);
    await service.recordVisit(path, visitorHash, new Date(now.getTime() + 30_000));
    await service.recordVisit(path, otherVisitorHash, new Date(now.getTime() - 4 * 60_000));

    const stats = await service.getPublicStats(now);
    expect(stats.totalPageViews).toBeGreaterThanOrEqual(3);
    expect(stats.onlineVisitors).toBeGreaterThanOrEqual(2);
  });

  it('does not count activity outside the five-minute online window', async () => {
    const path = `/stage-eleven-${suffix}`;
    await service.recordVisit(path, visitorHash, new Date(now.getTime() - 6 * 60_000));

    const stats = await service.getPublicStats(now);
    expect(stats.onlineVisitors).toBe(0);
  });
});
