import type { H3Event } from 'h3';
import { deleteCookie, getCookie, getHeader, getRequestIP, setCookie } from 'h3';

import { AuthRepository } from '../repositories/auth-repository';
import { AuthError, AuthService } from '../services/auth-service';
import { usePrisma } from './prisma';
import { SlidingWindowRateLimiter } from './rate-limit';

export const ADMIN_SESSION_COOKIE = 'jov3_admin_session';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const loginLimiter = new SlidingWindowRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1_000,
  maxKeys: 10_000,
});

export function useAuthService() {
  return new AuthService(new AuthRepository(usePrisma()));
}

export function readSessionToken(event: H3Event) {
  return getCookie(event, ADMIN_SESSION_COOKIE);
}

export function writeSessionCookie(event: H3Event, token: string, expires: Date) {
  setCookie(event, ADMIN_SESSION_COOKIE, token, {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires,
  });
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, ADMIN_SESSION_COOKIE, {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

export function consumeLoginAttempt(event: H3Event) {
  const key = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
  return loginLimiter.consume(key);
}

export function assertSameOrigin(event: H3Event) {
  const origin = getHeader(event, 'origin');
  if (!origin) return;

  const host = getHeader(event, 'x-forwarded-host') ?? getHeader(event, 'host');
  let originHost: string | undefined;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AuthError(403, 'FORBIDDEN_ORIGIN', 'Request origin is not allowed');
  }

  if (!host || originHost !== host) {
    throw new AuthError(403, 'FORBIDDEN_ORIGIN', 'Request origin is not allowed');
  }
}

export async function requireAdmin(event: H3Event) {
  const admin = await useAuthService().resolveSession(readSessionToken(event));
  event.context.admin = admin;
  return admin;
}
