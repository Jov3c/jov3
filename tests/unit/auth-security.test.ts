import { describe, expect, it } from 'vitest';

import { parseBootstrapConfig } from '../../server/services/admin-bootstrap';
import { SlidingWindowRateLimiter } from '../../server/utils/rate-limit';
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from '../../server/utils/security';

describe('admin authentication security', () => {
  it('hashes and verifies passwords with Argon2id', async () => {
    const hash = await hashPassword('a-strong-bootstrap-password');

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword(hash, 'a-strong-bootstrap-password')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
  });

  it('creates an opaque token and stores only its SHA-256 representation', () => {
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenHash).not.toContain(token);
  });

  it('requires explicit safe bootstrap values', () => {
    expect(() => parseBootstrapConfig({})).toThrow('ADMIN_EMAIL');
    expect(() =>
      parseBootstrapConfig({
        ADMIN_EMAIL: 'ADMIN@EXAMPLE.COM',
        ADMIN_PASSWORD: 'short',
        ADMIN_DISPLAY_NAME: 'Jov3',
      }),
    ).toThrow('12');

    expect(
      parseBootstrapConfig({
        ADMIN_EMAIL: 'ADMIN@EXAMPLE.COM',
        ADMIN_PASSWORD: 'a-strong-bootstrap-password',
        ADMIN_DISPLAY_NAME: 'Jov3',
      }).email,
    ).toBe('admin@example.com');
  });

  it('limits login attempts within a bounded time window', () => {
    const limiter = new SlidingWindowRateLimiter({ limit: 2, windowMs: 1_000, maxKeys: 10 });

    expect(limiter.consume('ip', 0).allowed).toBe(true);
    expect(limiter.consume('ip', 100).allowed).toBe(true);
    expect(limiter.consume('ip', 200).allowed).toBe(false);
    expect(limiter.consume('ip', 1_001).allowed).toBe(true);
  });
});
