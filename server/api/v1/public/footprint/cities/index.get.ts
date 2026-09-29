import { apiError } from '../../../../../utils/api-response';
import { footprintApiError } from '../../../../../services/footprint-service';
import { useFootprintService } from '../../../../../utils/footprint';

export default defineEventHandler(async (event) => {
  try {
    return { data: await useFootprintService().listPublicCities() };
  } catch (error) {
    const mapped = footprintApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
