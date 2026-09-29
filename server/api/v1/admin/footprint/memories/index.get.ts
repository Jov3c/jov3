import { getQuery } from 'h3';

import { apiError } from '../../../../../utils/api-response';
import { footprintApiError } from '../../../../../services/footprint-service';
import { useFootprintService } from '../../../../../utils/footprint';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const cityId = typeof query.cityId === 'string' ? query.cityId : undefined;
  try {
    return { data: await useFootprintService().listAdminMemories(cityId) };
  } catch (error) {
    const mapped = footprintApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
