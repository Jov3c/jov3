import { getRouterParam, readBody } from 'h3';
import { z } from 'zod';

import { projectUpdateSchema } from '../../../../../shared/schemas/project';
import { apiError } from '../../../../utils/api-response';
import { projectApiError } from '../../../../services/project-service';
import { useProjectService } from '../../../../utils/project';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = idSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success) return apiError(event, 400, 'INVALID_PROJECT_ID', 'Project id is invalid');
  const parsed = projectUpdateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Project fields are invalid',
      parsed.error.flatten(),
    );
  }

  try {
    return { data: await useProjectService().update(id.data, parsed.data) };
  } catch (error) {
    const projectError = projectApiError(error);
    if (projectError)
      return apiError(event, projectError.statusCode, projectError.code, projectError.message);
    throw error;
  }
});
