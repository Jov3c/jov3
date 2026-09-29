import { readBody } from 'h3';

import { adminFriendLinkCreateSchema } from '../../../../../shared/schemas/friend-links';
import { apiError } from '../../../../utils/api-response';
import { friendLinkApiError } from '../../../../services/friend-link-service';
import { useFriendLinkService } from '../../../../utils/friend-links';

export default defineEventHandler(async (event) => {
  const parsed = adminFriendLinkCreateSchema.safeParse(await readBody(event));
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
    return { data: await useFriendLinkService().createAdmin(parsed.data) };
  } catch (error) {
    const mapped = friendLinkApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
