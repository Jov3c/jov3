import { getRouterParam } from 'h3';
import { z } from 'zod';

import { apiError } from '../../../../utils/api-response';
import { projectApiError } from '../../../../services/project-service';
import { useProjectService } from '../../../../utils/project';

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export default defineEventHandler(async (event) => {
  const slug = slugSchema.safeParse(getRouterParam(event, 'slug'));
  if (!slug.success) return apiError(event, 400, 'INVALID_PROJECT_SLUG', 'Project slug is invalid');

  try {
    return { data: await useProjectService().getPublicBySlug(slug.data) };
  } catch (error) {
    const projectError = projectApiError(error);
    if (projectError)
      return apiError(event, projectError.statusCode, projectError.code, projectError.message);
    throw error;
  }
});
