import { getQuery, getRouterParam } from 'h3';

import { publicCommunityListQuerySchema } from '../../../../../../shared/schemas/community';
import { apiError } from '../../../../../utils/api-response';
import { communityApiError } from '../../../../../services/community-service';
import { useCommunityService } from '../../../../../utils/community';

export default defineEventHandler(async (event) => {
  const parsed = publicCommunityListQuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Comment query is invalid',
      parsed.error.flatten(),
    );
  }

  const slug = getRouterParam(event, 'slug')?.trim().toLowerCase();
  if (!slug) return apiError(event, 400, 'INVALID_POST_SLUG', 'Post slug is required');

  try {
    const result = await useCommunityService().listPublicComments(slug, parsed.data);
    return {
      data: result.items,
      meta: {
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        total: result.total,
        publishedTotal: result.publishedTotal,
      },
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
