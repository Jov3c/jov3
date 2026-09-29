import { getQuery } from 'h3';

import { mediaListQuerySchema } from '../../../../../shared/schemas/media';
import { apiError } from '../../../../utils/api-response';
import { useMediaService } from '../../../../utils/media';

export default defineEventHandler(async (event) => {
  const parsed = mediaListQuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Media query is invalid',
      parsed.error.flatten(),
    );
  }

  const result = await useMediaService().list(parsed.data);
  return {
    data: result.items,
    meta: {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      total: result.total,
    },
  };
});
