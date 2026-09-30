import { createHash } from 'node:crypto';

import { getCookie, getRequestIP, setCookie, type H3Event } from 'h3';

import { createVisitorId, hashVisitorId, isValidVisitorId, VISITOR_COOKIE_NAME } from './stats';

export function getVisitorIpHash(event: H3Event) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
  return createHash('sha256').update(ip, 'utf8').digest('hex');
}

export function getOrSetVisitorHash(event: H3Event) {
  const existing = getCookie(event, VISITOR_COOKIE_NAME);
  const visitorId = existing && isValidVisitorId(existing) ? existing : createVisitorId();

  if (visitorId !== existing) {
    setCookie(event, VISITOR_COOKIE_NAME, visitorId, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return hashVisitorId(visitorId);
}
