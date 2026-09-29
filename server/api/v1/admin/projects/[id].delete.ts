import { getRouterParam } from 'h3';
import { z } from 'zod';

import { apiError } from '../../../../utils/api-response';
import { projectApiError } from '../../../../services/project-service';
import { useProjectService } from '../../../../utils/project';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = idSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success) return apiError(event, 400, 'INVALID_PROJECT_ID', 'Project id is invalid');

  try {
    return { data: await useProjectService().delete(id.data) };
  } catch (error) {
    const projectError = projectApiError(error);
    if (projectError)
      return apiError(event, projectError.statusCode, projectError.code, projectError.message);
    throw error;
  }
});
