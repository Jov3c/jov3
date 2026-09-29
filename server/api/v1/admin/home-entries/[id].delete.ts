import { getRouterParam } from 'h3';
import { z } from 'zod';

import { apiError } from '../../../../utils/api-response';
import { homeApiError } from '../../../../services/home-service';
import { useHomeService } from '../../../../utils/home';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = idSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success) return apiError(event, 400, 'INVALID_HOME_ENTRY_ID', 'Home entry id is invalid');

  try {
    return { data: await useHomeService().deleteEntry(id.data) };
  } catch (error) {
    const homeError = homeApiError(error);
    if (homeError) return apiError(event, homeError.statusCode, homeError.code, homeError.message);
    throw error;
  }
});
