import { describe, expect, it } from 'vitest';

import {
  calculateUptime,
  createVisitorId,
  hashVisitorId,
  isValidVisitorId,
  normalizeTrackedPath,
} from '../../server/utils/stats';

describe('site stats utilities', () => {
  it('normalizes public paths and strips query strings', () => {
    expect(normalizeTrackedPath('/blog/server?utm_source=test')).toBe('/blog/server');
    expect(normalizeTrackedPath('/')).toBe('/');
    expect(normalizeTrackedPath('/api/v1/public/site/stats')).toBeNull();
    expect(normalizeTrackedPath('/admin')).toBeNull();
    expect(normalizeTrackedPath('https://example.com/blog')).toBeNull();
  });

  it('creates a valid first-party visitor id while hashing only the stored value', () => {
    const visitorId = createVisitorId();
    expect(isValidVisitorId(visitorId)).toBe(true);
    expect(hashVisitorId(visitorId)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashVisitorId(visitorId)).not.toBe(visitorId);
    expect(isValidVisitorId('not-a-visitor-id')).toBe(false);
  });

  it('calculates non-negative uptime in days, hours, and minutes', () => {
    expect(
      calculateUptime(new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-02T01:02:59.000Z')),
    ).toEqual({ days: 1, hours: 1, minutes: 2 });
    expect(
      calculateUptime(new Date('2026-02-01T00:00:00.000Z'), new Date('2026-01-01T00:00:00.000Z')),
    ).toEqual({ days: 0, hours: 0, minutes: 0 });
  });
});
