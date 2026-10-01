import { describe, expect, it } from 'vitest';

import { StatsRepository } from '../../server/repositories/stats-repository';

describe('stats repository', () => {
  it('reads public stats through one database operation at a time', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const query = async <T>(result: T) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return result;
    };

    const prisma = {
      pageViewDaily: {
        aggregate: () => query({ _sum: { views: BigInt(7) } }),
      },
      post: {
        count: () => query(18),
        aggregate: () => query({ _sum: { wordCount: 28_510 } }),
      },
      postCategory: {
        count: () => query(4),
      },
      visitorActivity: {
        count: () => query(3),
      },
      siteProfile: {
        findFirst: () => query({ foundedAt: new Date('2026-01-01T00:00:00.000Z') }),
      },
    } as never;

    const result = await new StatsRepository(prisma).getPublicStats(
      new Date('2026-09-30T00:00:00.000Z'),
    );

    expect(result).toEqual({
      totalPageViews: BigInt(7),
      onlineVisitors: 3,
      foundedAt: new Date('2026-01-01T00:00:00.000Z'),
      totalPosts: 18,
      totalCategories: 4,
      totalWords: 28_510,
    });
    expect(maxInFlight).toBe(1);
  });
});
