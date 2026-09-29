import { getRouterParam } from 'h3';
import { z } from 'zod';

import { apiError } from '../../../../utils/api-response';
import { mediaApiError } from '../../../../services/media-service';
import { useMediaService } from '../../../../utils/media';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return apiError(event, 400, 'INVALID_MEDIA_ID', 'Media id is invalid');

  try {
    return { data: await useMediaService().delete(parsedId.data) };
  } catch (error) {
    const mediaError = mediaApiError(error);
    if (mediaError)
      return apiError(event, mediaError.statusCode, mediaError.code, mediaError.message);
    throw error;
  }
});
