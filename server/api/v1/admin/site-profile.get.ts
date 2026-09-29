import { apiError } from '../../../utils/api-response';
import { homeApiError } from '../../../services/home-service';
import { useHomeService } from '../../../utils/home';

export default defineEventHandler(async (event) => {
  try {
    return { data: await useHomeService().getAdminSiteProfile() };
  } catch (error) {
    const homeError = homeApiError(error);
    if (homeError) return apiError(event, homeError.statusCode, homeError.code, homeError.message);
    throw error;
  }
});
