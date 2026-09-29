import { apiError } from '../../../utils/api-response';
import { timelineApiError } from '../../../services/timeline-service';
import { useTimelineService } from '../../../utils/timeline';

export default defineEventHandler(async (event) => {
  try {
    return { data: await useTimelineService().listPublic() };
  } catch (error) {
    const mapped = timelineApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
