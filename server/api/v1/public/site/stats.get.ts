import { setHeader } from 'h3';

import { statsApiError } from '../../../../services/stats-service';
import { apiError } from '../../../../utils/api-response';
import { useStatsService } from '../../../../utils/site-stats';

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store');
  try {
    return { data: await useStatsService().getPublicStats() };
  } catch (error) {
    const mapped = statsApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
