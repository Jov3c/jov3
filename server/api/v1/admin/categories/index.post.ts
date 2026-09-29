import { readBody } from 'h3';

import { categoryCreateSchema } from '../../../../../shared/schemas/blog';
import { apiError } from '../../../../utils/api-response';
import { blogApiError } from '../../../../services/blog-service';
import { useBlogService } from '../../../../utils/blog';

export default defineEventHandler(async (event) => {
  const parsed = categoryCreateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Category fields are invalid',
      parsed.error.flatten(),
    );
  }

  try {
    return { data: await useBlogService().createCategory(parsed.data) };
  } catch (error) {
    const blogError = blogApiError(error);
    if (blogError) return apiError(event, blogError.statusCode, blogError.code, blogError.message);
    throw error;
  }
});
