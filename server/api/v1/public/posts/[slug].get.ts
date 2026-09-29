import { getRouterParam } from 'h3';

import { apiError } from '../../../../utils/api-response';
import { blogApiError } from '../../../../services/blog-service';
import { useBlogService } from '../../../../utils/blog';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')?.trim().toLowerCase();
  if (!slug) return apiError(event, 400, 'INVALID_POST_SLUG', 'Post slug is required');

  try {
    return { data: await useBlogService().getPublicPostBySlug(slug) };
  } catch (error) {
    const blogError = blogApiError(error);
    if (blogError) return apiError(event, blogError.statusCode, blogError.code, blogError.message);
    throw error;
  }
});
