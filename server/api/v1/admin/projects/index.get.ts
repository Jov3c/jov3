import { apiError } from '../../../../utils/api-response';
import { projectApiError } from '../../../../services/project-service';
import { useProjectService } from '../../../../utils/project';

export default defineEventHandler(async (event) => {
  try {
    return { data: await useProjectService().listAdmin() };
  } catch (error) {
    const projectError = projectApiError(error);
    if (projectError)
      return apiError(event, projectError.statusCode, projectError.code, projectError.message);
    throw error;
  }
});
