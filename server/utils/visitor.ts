import { createHash } from 'node:crypto';

import { getRequestIP, type H3Event } from 'h3';

export function getVisitorIpHash(event: H3Event) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
  return createHash('sha256').update(ip, 'utf8').digest('hex');
}
