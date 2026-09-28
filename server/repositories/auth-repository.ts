import type { PrismaClient } from '../generated/prisma/client';
import type { AuthRepositoryContract } from '../services/auth-service';

export class AuthRepository implements AuthRepositoryContract {
  constructor(private readonly prisma: PrismaClient) {}

  findAdminByEmail(email: string) {
    return this.prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, passwordHash: true },
    });
  }

  createSession(input: { adminId: string; tokenHash: string; expiresAt: Date }) {
    return this.prisma.adminSession.create({
      data: input,
      select: { id: true, expiresAt: true },
    });
  }

  findActiveSession(tokenHash: string, now: Date) {
    return this.prisma.adminSession.findFirst({
      where: { tokenHash, expiresAt: { gt: now } },
      select: {
        id: true,
        expiresAt: true,
        admin: { select: { id: true, email: true, displayName: true } },
      },
    });
  }

  async touchSession(id: string, now: Date) {
    await this.prisma.adminSession.update({ where: { id }, data: { lastSeenAt: now } });
  }

  async deleteSession(tokenHash: string) {
    await this.prisma.adminSession.deleteMany({ where: { tokenHash } });
  }
}
