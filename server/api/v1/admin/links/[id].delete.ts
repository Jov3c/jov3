import { getRouterParam } from 'h3';
import { z } from 'zod';

import { apiError } from '../../../../utils/api-response';
import { friendLinkApiError } from '../../../../services/friend-link-service';
import { useFriendLinkService } from '../../../../utils/friend-links';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = idSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success)
    return apiError(event, 400, 'INVALID_FRIEND_LINK_ID', 'Friend link id is invalid');

  try {
    return { data: await useFriendLinkService().delete(id.data) };
  } catch (error) {
    const mapped = friendLinkApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
