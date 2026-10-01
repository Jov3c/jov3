import type { StatsRepository } from '../repositories/stats-repository';
import { calculateUptime, formatUptime } from '../utils/stats';

export class StatsError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'StatsError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class StatsService {
  constructor(private readonly repository: StatsRepository) {}

  async recordVisit(path: string, visitorHash: string, now = new Date()) {
    if (!/^[a-f0-9]{64}$/.test(visitorHash)) {
      throw new StatsError(400, 'INVALID_VISITOR', 'Visitor identity is invalid');
    }
    await this.repository.recordVisit(path, visitorHash, now);
    return { accepted: true };
  }

  async getPublicStats(now = new Date()) {
    const result = await this.repository.getPublicStats(now);
    if (!result.foundedAt) {
      throw new StatsError(503, 'STATS_NOT_CONFIGURED', 'Site stats are not configured');
    }
    const uptime = calculateUptime(result.foundedAt, now);
    return {
      onlineVisitors: result.onlineVisitors,
      totalPageViews: Number(result.totalPageViews),
      totalPosts: result.totalPosts,
      totalCategories: result.totalCategories,
      totalWords: result.totalWords,
      foundedAt: result.foundedAt.toISOString().slice(0, 10),
      uptime: { ...uptime, label: formatUptime(uptime) },
    };
  }
}

export function statsApiError(error: unknown) {
  if (error instanceof StatsError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  return null;
}
