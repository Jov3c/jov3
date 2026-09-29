import { readBody } from 'h3';

import { projectCreateSchema } from '../../../../../shared/schemas/project';
import { apiError } from '../../../../utils/api-response';
import { projectApiError } from '../../../../services/project-service';
import { useProjectService } from '../../../../utils/project';

export default defineEventHandler(async (event) => {
  const parsed = projectCreateSchema.safeParse(await readBody(event));
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
    return { data: await useProjectService().create(parsed.data) };
  } catch (error) {
    const projectError = projectApiError(error);
    if (projectError)
      return apiError(event, projectError.statusCode, projectError.code, projectError.message);
    throw error;
  }
});
