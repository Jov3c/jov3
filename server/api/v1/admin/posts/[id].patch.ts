import { getRouterParam, readBody } from 'h3';
import { z } from 'zod';

import { postUpdateSchema } from '../../../../../shared/schemas/blog';
import { apiError } from '../../../../utils/api-response';
import { blogApiError } from '../../../../services/blog-service';
import { useBlogService } from '../../../../utils/blog';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = idSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success) return apiError(event, 400, 'INVALID_POST_ID', 'Post id is invalid');
  const parsed = postUpdateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Post fields are invalid',
      parsed.error.flatten(),
    );
  }

  try {
    return { data: await useBlogService().updatePost(id.data, parsed.data) };
  } catch (error) {
    const blogError = blogApiError(error);
    if (blogError) return apiError(event, blogError.statusCode, blogError.code, blogError.message);
    throw error;
  }
});
