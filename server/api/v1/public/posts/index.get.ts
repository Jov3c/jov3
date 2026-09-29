import { getQuery } from 'h3';

import { postListQuerySchema } from '../../../../../shared/schemas/blog';
import { apiError } from '../../../../utils/api-response';
import { blogApiError } from '../../../../services/blog-service';
import { useBlogService } from '../../../../utils/blog';

export default defineEventHandler(async (event) => {
  const parsed = postListQuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Post query is invalid',
      parsed.error.flatten(),
    );
  }

  try {
    const result = await useBlogService().listPublicPosts(parsed.data);
    return {
      data: { items: result.items },
      meta: {
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        total: result.total,
        stats: result.stats,
      },
    };
  } catch (error) {
    const blogError = blogApiError(error);
    if (blogError) return apiError(event, blogError.statusCode, blogError.code, blogError.message);
    throw error;
  }
});
