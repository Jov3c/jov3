import { defineEventHandler } from 'h3';

import { authApiError } from '../../../utils/api-response';
import { requireAdmin } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event);
    return { data: { admin } };
  } catch (error) {
    return authApiError(event, error);
  }
});
