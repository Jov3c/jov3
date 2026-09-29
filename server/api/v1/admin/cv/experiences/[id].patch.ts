import { getRouterParam, readBody } from 'h3';

import { cvExperienceUpdateSchema } from '../../../../../../shared/schemas/cv-timeline';
import { apiError } from '../../../../../utils/api-response';
import { cvApiError } from '../../../../../services/cv-service';
import { useCvService } from '../../../../../utils/cv';

export default defineEventHandler(async (event) => {
  const parsed = cvExperienceUpdateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Experience fields are invalid',
      parsed.error.flatten(),
    );
  }
  try {
    return {
      data: await useCvService().updateExperience(getRouterParam(event, 'id')!, parsed.data),
    };
  } catch (error) {
    const mapped = cvApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
