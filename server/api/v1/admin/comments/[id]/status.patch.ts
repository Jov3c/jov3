import { getRouterParam, readBody } from 'h3';
import { z } from 'zod';

import { moderationStatusUpdateSchema } from '../../../../../../shared/schemas/community';
import { apiError } from '../../../../../utils/api-response';
import { communityApiError } from '../../../../../services/community-service';
import { useCommunityService } from '../../../../../utils/community';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = idSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success) return apiError(event, 400, 'INVALID_COMMENT_ID', 'Comment id is invalid');
  const parsed = moderationStatusUpdateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Comment status is invalid',
      parsed.error.flatten(),
    );
  }

  try {
    return { data: await useCommunityService().updateCommentStatus(id.data, parsed.data.status) };
  } catch (error) {
    const communityError = communityApiError(error);
    if (communityError)
      return apiError(
        event,
        communityError.statusCode,
        communityError.code,
        communityError.message,
      );
    throw error;
  }
});
