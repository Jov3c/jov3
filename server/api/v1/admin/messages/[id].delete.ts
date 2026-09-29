import { getRouterParam } from 'h3';
import { z } from 'zod';

import { apiError } from '../../../../utils/api-response';
import { communityApiError } from '../../../../services/community-service';
import { useCommunityService } from '../../../../utils/community';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = idSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success) return apiError(event, 400, 'INVALID_MESSAGE_ID', 'Message id is invalid');

  try {
    return { data: await useCommunityService().deleteMessage(id.data) };
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
