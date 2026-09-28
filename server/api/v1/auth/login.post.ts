import { defineEventHandler, readBody, setHeader } from 'h3';

import { loginSchema } from '#shared/schemas/auth';
import { apiError, authApiError } from '../../../utils/api-response';
import {
  assertSameOrigin,
  consumeLoginAttempt,
  useAuthService,
  writeSessionCookie,
} from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    assertSameOrigin(event);
  } catch (error) {
    return authApiError(event, error);
  }

  const limit = consumeLoginAttempt(event);
  setHeader(event, 'X-RateLimit-Remaining', String(limit.remaining));
  if (!limit.allowed) {
    setHeader(event, 'Retry-After', Math.ceil(limit.retryAfterMs / 1_000));
    return apiError(event, 429, 'RATE_LIMITED', 'Too many login attempts');
  }

  const body = loginSchema.safeParse(await readBody(event));
  if (!body.success) {
    return apiError(event, 400, 'VALIDATION_ERROR', '请求参数不正确', body.error.flatten());
  }

  try {
    const login = await useAuthService().login(body.data.email, body.data.password);
    writeSessionCookie(event, login.token, login.expiresAt);
    return { data: { admin: login.admin } };
  } catch (error) {
    return authApiError(event, error);
  }
});
