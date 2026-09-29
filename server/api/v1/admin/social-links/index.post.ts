import { readBody } from 'h3';

import { socialLinkCreateSchema } from '../../../../../shared/schemas/home';
import { apiError } from '../../../../utils/api-response';
import { homeApiError } from '../../../../services/home-service';
import { useHomeService } from '../../../../utils/home';

export default defineEventHandler(async (event) => {
  const parsed = socialLinkCreateSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    return apiError(
      event,
      400,
      'VALIDATION_ERROR',
      'Social link fields are invalid',
      parsed.error.flatten(),
    );
  }

  try {
    return { data: await useHomeService().createSocialLink(parsed.data) };
  } catch (error) {
    const homeError = homeApiError(error);
    if (homeError) return apiError(event, homeError.statusCode, homeError.code, homeError.message);
    throw error;
  }
});
