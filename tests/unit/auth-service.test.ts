import { describe, expect, it } from 'vitest';

import { AuthService, type AuthRepositoryContract } from '../../server/services/auth-service';
import { hashPassword } from '../../server/utils/security';

function createRepository(passwordHash: string): AuthRepositoryContract & { storedHash?: string } {
  return {
    async findAdminByEmail(email) {
      return email === 'admin@example.com'
        ? { id: 'admin-id', email, displayName: 'Jov3', passwordHash }
        : null;
    },
    async createSession(input) {
      this.storedHash = input.tokenHash;
      return { id: 'session-id', expiresAt: input.expiresAt };
    },
    async findActiveSession(tokenHash) {
      return tokenHash === this.storedHash
        ? {
            id: 'session-id',
            expiresAt: new Date(Date.now() + 60_000),
            admin: { id: 'admin-id', email: 'admin@example.com', displayName: 'Jov3' },
          }
        : null;
    },
    async touchSession() {},
    async deleteSession(tokenHash) {
      if (tokenHash === this.storedHash) this.storedHash = undefined;
    },
  };
}

describe('AuthService', () => {
  it('returns one generic unauthorized result for unknown users and bad passwords', async () => {
    const passwordHash = await hashPassword('a-strong-bootstrap-password');
    const service = new AuthService(createRepository(passwordHash));

    await expect(service.login('missing@example.com', 'anything')).rejects.toMatchObject({
      statusCode: 401,
    });
    await expect(service.login('admin@example.com', 'wrong')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('stores only the token hash and invalidates it on logout', async () => {
    const passwordHash = await hashPassword('a-strong-bootstrap-password');
    const repository = createRepository(passwordHash);
    const service = new AuthService(repository);

    const login = await service.login('ADMIN@EXAMPLE.COM', 'a-strong-bootstrap-password');
    expect(repository.storedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(repository.storedHash).not.toContain(login.token);
    await expect(service.resolveSession(login.token)).resolves.toMatchObject({
      email: 'admin@example.com',
    });

    await service.logout(login.token);
    await expect(service.resolveSession(login.token)).rejects.toMatchObject({ statusCode: 401 });
  });
});
