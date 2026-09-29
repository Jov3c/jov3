import { getQuery } from 'h3';

import { adminPostListQuerySchema } from '../../../../../shared/schemas/blog';
import { apiError } from '../../../../utils/api-response';
import { blogApiError } from '../../../../services/blog-service';
import { useBlogService } from '../../../../utils/blog';

export default defineEventHandler(async (event) => {
  const parsed = adminPostListQuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Admin post query is invalid',
      parsed.error.flatten(),
    );
  }

  try {
    const result = await useBlogService().listAdminPosts(parsed.data);
    return { data: result.items, meta: { total: result.total } };
  } catch (error) {
    const blogError = blogApiError(error);
    if (blogError) return apiError(event, blogError.statusCode, blogError.code, blogError.message);
    throw error;
  }
});
