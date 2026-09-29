import { apiError } from '../../../../../utils/api-response';
import { cvApiError } from '../../../../../services/cv-service';
import { useCvService } from '../../../../../utils/cv';

export default defineEventHandler(async (event) => {
  try {
    const data = await useCvService().getAdmin();
    return { data: data.educations };
  } catch (error) {
    const mapped = cvApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
