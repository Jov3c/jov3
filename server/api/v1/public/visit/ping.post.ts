import { readBody, setHeader } from 'h3';

import { visitPingSchema } from '#shared/schemas/stats';
import { statsApiError } from '../../../../services/stats-service';
import { apiError } from '../../../../utils/api-response';
import { normalizeTrackedPath } from '../../../../utils/stats';
import { getOrSetVisitorHash, getVisitorIpHash } from '../../../../utils/visitor';
import { useStatsService } from '../../../../utils/site-stats';
import { SlidingWindowRateLimiter } from '../../../../utils/rate-limit';

const visitLimiter = new SlidingWindowRateLimiter({
  limit: 120,
  windowMs: 60_000,
  maxKeys: 20_000,
});

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store');
  const limit = visitLimiter.consume(getVisitorIpHash(event));
  setHeader(event, 'X-RateLimit-Remaining', String(limit.remaining));
  if (!limit.allowed) {
    setHeader(event, 'Retry-After', Math.ceil(limit.retryAfterMs / 1_000));
    return apiError(event, 429, 'RATE_LIMITED', 'Too many visit pings');
  }

  const parsed = visitPingSchema.safeParse(await readBody(event));
  const path = parsed.success ? normalizeTrackedPath(parsed.data.path) : null;
  if (!path) return apiError(event, 400, 'INVALID_PATH', 'Public page path is invalid');

  try {
    return { data: await useStatsService().recordVisit(path, getOrSetVisitorHash(event)) };
  } catch (error) {
    const mapped = statsApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
