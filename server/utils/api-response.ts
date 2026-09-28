import type { H3Event } from 'h3';
import { setResponseStatus } from 'h3';

import { AuthError } from '../services/auth-service';

export function apiError(
  event: H3Event,
  statusCode: number,
  code: string,
  message: string,
  details: unknown = {},
) {
  setResponseStatus(event, statusCode);
  return { error: { code, message, details } };
}

export function authApiError(event: H3Event, error: unknown) {
  if (error instanceof AuthError) {
    return apiError(event, error.statusCode, error.code, error.message);
  }

  throw error;
}
