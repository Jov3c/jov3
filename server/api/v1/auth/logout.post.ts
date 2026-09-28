import { defineEventHandler } from 'h3';

import { authApiError } from '../../../utils/api-response';
import {
  assertSameOrigin,
  clearSessionCookie,
  readSessionToken,
  useAuthService,
} from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    assertSameOrigin(event);
    await useAuthService().logout(readSessionToken(event));
    clearSessionCookie(event);
    return { data: { success: true } };
  } catch (error) {
    return authApiError(event, error);
  }
});
