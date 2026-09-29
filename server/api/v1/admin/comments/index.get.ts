import { getQuery } from 'h3';

import { adminCommentListQuerySchema } from '../../../../../shared/schemas/community';
import { apiError } from '../../../../utils/api-response';
import { communityApiError } from '../../../../services/community-service';
import { useCommunityService } from '../../../../utils/community';

export default defineEventHandler(async (event) => {
  const parsed = adminCommentListQuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Admin comment query is invalid',
      parsed.error.flatten(),
    );
  }

  try {
    const result = await useCommunityService().listAdminComments(parsed.data);
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
