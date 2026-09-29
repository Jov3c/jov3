import { getRouterParam, readBody } from 'h3';

import { footprintMemoryUpdateSchema } from '../../../../../../shared/schemas/footprint';
import { apiError } from '../../../../../utils/api-response';
import { footprintApiError } from '../../../../../services/footprint-service';
import { useFootprintService } from '../../../../../utils/footprint';

export default defineEventHandler(async (event) => {
  const parsed = footprintMemoryUpdateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Footprint memory fields are invalid',
      parsed.error.flatten(),
    );
  }
  try {
    return {
      data: await useFootprintService().updateMemory(
        getRouterParam(event, 'id') ?? '',
        parsed.data,
      ),
    };
  } catch (error) {
    const mapped = footprintApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
