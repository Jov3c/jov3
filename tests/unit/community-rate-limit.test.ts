import { describe, expect, it } from 'vitest';

import { SlidingWindowRateLimiter } from '../../server/utils/rate-limit';

describe('community write rate limit', () => {
  it('allows five writes per key and returns retry metadata for the sixth', () => {
    const limiter = new SlidingWindowRateLimiter({ limit: 5, windowMs: 60_000, maxKeys: 100 });
    for (let index = 0; index < 5; index += 1) {
      expect(limiter.consume('visitor-hash', 1_000 + index).allowed).toBe(true);
    }
    const blocked = limiter.consume('visitor-hash', 2_000);
    expect(blocked).toMatchObject({ allowed: false, remaining: 0 });
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(limiter.consume('another-visitor', 2_000).allowed).toBe(true);
  });
});
