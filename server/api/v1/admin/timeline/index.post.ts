import { readBody } from 'h3';

import { timelineEntrySchema } from '../../../../../shared/schemas/cv-timeline';
import { apiError } from '../../../../utils/api-response';
import { timelineApiError } from '../../../../services/timeline-service';
import { useTimelineService } from '../../../../utils/timeline';

export default defineEventHandler(async (event) => {
  const parsed = timelineEntrySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Timeline fields are invalid',
      parsed.error.flatten(),
    );
  }
  try {
    return { data: await useTimelineService().create(parsed.data) };
  } catch (error) {
    const mapped = timelineApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
