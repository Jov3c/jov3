import { getRouterParam, readBody } from 'h3';
import { z } from 'zod';

import { adminFriendLinkUpdateSchema } from '../../../../../shared/schemas/friend-links';
import { apiError } from '../../../../utils/api-response';
import { friendLinkApiError } from '../../../../services/friend-link-service';
import { useFriendLinkService } from '../../../../utils/friend-links';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = idSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success)
    return apiError(event, 400, 'INVALID_FRIEND_LINK_ID', 'Friend link id is invalid');
  const parsed = adminFriendLinkUpdateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Friend link fields are invalid',
      parsed.error.flatten(),
    );
  }

  try {
    return { data: await useFriendLinkService().update(id.data, parsed.data) };
  } catch (error) {
    const mapped = friendLinkApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
