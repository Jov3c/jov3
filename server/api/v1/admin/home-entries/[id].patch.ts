import { getRouterParam, readBody } from 'h3';
import { z } from 'zod';

import { homeEntryUpdateSchema } from '../../../../../shared/schemas/home';
import { apiError } from '../../../../utils/api-response';
import { homeApiError } from '../../../../services/home-service';
import { useHomeService } from '../../../../utils/home';

const idSchema = z.string().uuid();

export default defineEventHandler(async (event) => {
  const id = idSchema.safeParse(getRouterParam(event, 'id'));
  if (!id.success) return apiError(event, 400, 'INVALID_HOME_ENTRY_ID', 'Home entry id is invalid');
  const parsed = homeEntryUpdateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Home entry fields are invalid',
      parsed.error.flatten(),
    );
  }

  try {
    return { data: await useHomeService().updateEntry(id.data, parsed.data) };
  } catch (error) {
    const homeError = homeApiError(error);
    if (homeError) return apiError(event, homeError.statusCode, homeError.code, homeError.message);
    throw error;
  }
});
