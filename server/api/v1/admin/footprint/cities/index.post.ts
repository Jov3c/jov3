import { readBody } from 'h3';

import { footprintCitySchema } from '../../../../../../shared/schemas/footprint';
import { apiError } from '../../../../../utils/api-response';
import { footprintApiError } from '../../../../../services/footprint-service';
import { useFootprintService } from '../../../../../utils/footprint';

export default defineEventHandler(async (event) => {
  const parsed = footprintCitySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Footprint city fields are invalid',
      parsed.error.flatten(),
    );
  }
  try {
    return { data: await useFootprintService().createCity(parsed.data) };
  } catch (error) {
    const mapped = footprintApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
