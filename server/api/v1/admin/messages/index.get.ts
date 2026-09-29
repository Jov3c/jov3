import { getQuery } from 'h3';

import { adminMessageListQuerySchema } from '../../../../../shared/schemas/community';
import { apiError } from '../../../../utils/api-response';
import { communityApiError } from '../../../../services/community-service';
import { useCommunityService } from '../../../../utils/community';

export default defineEventHandler(async (event) => {
  const parsed = adminMessageListQuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Admin message query is invalid',
      parsed.error.flatten(),
    );
  }

  try {
    const result = await useCommunityService().listAdminMessages(parsed.data);
    return {
      data: result.items,
      meta: { page: parsed.data.page, pageSize: parsed.data.pageSize, total: result.total },
    };
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
