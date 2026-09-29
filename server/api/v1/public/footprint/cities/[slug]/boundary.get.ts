import { getRouterParam } from 'h3';

import { apiError } from '../../../../../../utils/api-response';
import { footprintApiError } from '../../../../../../services/footprint-service';
import { footprintGeoApiError } from '../../../../../../services/footprint-geo';
import { useFootprintGeoAdapter, useFootprintService } from '../../../../../../utils/footprint';

export default defineEventHandler(async (event) => {
  try {
    const city = await useFootprintService().getBoundaryCity(getRouterParam(event, 'slug') ?? '');
    return { data: await useFootprintGeoAdapter().resolve(city) };
  } catch (error) {
    const mapped = footprintApiError(error) ?? footprintGeoApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
