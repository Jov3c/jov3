import { getQuery } from 'h3';

import { friendLinkListQuerySchema } from '../../../../../shared/schemas/friend-links';
import { apiError } from '../../../../utils/api-response';
import { friendLinkApiError } from '../../../../services/friend-link-service';
import { useFriendLinkService } from '../../../../utils/friend-links';

export default defineEventHandler(async (event) => {
  const parsed = friendLinkListQuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Admin friend link query is invalid',
      parsed.error.flatten(),
    );
  }

  try {
    const result = await useFriendLinkService().listAdminLinks(parsed.data);
    return {
      data: result.items,
      meta: { page: parsed.data.page, pageSize: parsed.data.pageSize, total: result.total },
    };
  } catch (error) {
    const mapped = friendLinkApiError(error);
    if (mapped) return apiError(event, mapped.statusCode, mapped.code, mapped.message);
    throw error;
  }
});
