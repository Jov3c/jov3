import { defineEventHandler } from 'h3';

import { authApiError } from '../utils/api-response';
import { requireAdmin } from '../utils/auth';

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/v1/admin/')) return;

  try {
    await requireAdmin(event);
  } catch (error) {
    return authApiError(event, error);
  }
});
