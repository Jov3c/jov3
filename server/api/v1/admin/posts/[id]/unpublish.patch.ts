import { getRouterParam } from 'h3';
import { z } from 'zod';

import { apiError } from '../../../../../utils/api-response';
import { blogApiError } from '../../../../../services/blog-service';
import { useBlogService } from '../../../../../utils/blog';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = idSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success) return apiError(event, 400, 'INVALID_POST_ID', 'Post id is invalid');

  try {
    return { data: await useBlogService().unpublishPost(id.data) };
  } catch (error) {
    const blogError = blogApiError(error);
    if (blogError) return apiError(event, blogError.statusCode, blogError.code, blogError.message);
    throw error;
  }
});
