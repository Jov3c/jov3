import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AuthRepository } from '../../server/repositories/auth-repository';
import { bootstrapAdmin } from '../../server/services/admin-bootstrap';
import { AuthService } from '../../server/services/auth-service';
import { createPrismaClient } from '../../server/utils/prisma';

const email = 'stage02-auth-test@example.com';
const password = 'stage-02-integration-password';
const databaseUrl = process.env.DATABASE_URL ?? '';
const prisma = createPrismaClient(databaseUrl);

describe('admin authentication lifecycle', () => {
  beforeAll(async () => {
    await prisma.adminSession.deleteMany({ where: { admin: { email } } });
    await prisma.adminUser.deleteMany({ where: { email } });
    await bootstrapAdmin(prisma, { email, password, displayName: 'Stage 02 Test' });
  });

  afterAll(async () => {
    await prisma.adminSession.deleteMany({ where: { admin: { email } } });
    await prisma.adminUser.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('stores an Argon2id password and a hash-only session', async () => {
    const repository = new AuthRepository(prisma);
    const service = new AuthService(repository);
    const login = await service.login(email, password);

    const user = await prisma.adminUser.findUniqueOrThrow({ where: { email } });
    const session = await prisma.adminSession.findFirstOrThrow({ where: { adminId: user.id } });
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(session.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(session.tokenHash).not.toContain(login.token);
    await expect(service.resolveSession(login.token)).resolves.toMatchObject({ email });

    await service.logout(login.token);
    await expect(service.resolveSession(login.token)).rejects.toMatchObject({ statusCode: 401 });
  });
});
