import type { PrismaClient } from '../generated/prisma/client';

export interface EmailVerificationCreateInput {
  purpose: string;
  entityId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface EmailVerificationRepositoryContract {
  invalidateActive(input: {
    purpose: string;
    entityId: string;
    email: string;
    now: Date;
  }): Promise<unknown>;
  create(input: EmailVerificationCreateInput): Promise<{ id: string }>;
  delete(id: string): Promise<unknown>;
  consume(
    tokenHash: string,
    now: Date,
  ): Promise<{
    purpose: string;
    entityId: string;
    email: string;
  } | null>;
}

export class EmailVerificationRepository implements EmailVerificationRepositoryContract {
  constructor(private readonly prisma: PrismaClient) {}

  invalidateActive(input: { purpose: string; entityId: string; email: string; now: Date }) {
    return this.prisma.emailVerification.updateMany({
      where: {
        purpose: input.purpose,
        entityId: input.entityId,
        consumedAt: null,
      },
      data: { consumedAt: input.now },
    });
  }

  async create(input: EmailVerificationCreateInput) {
    return this.prisma.emailVerification.create({ data: input });
  }

  delete(id: string) {
    return this.prisma.emailVerification.delete({ where: { id } });
  }

  async consume(tokenHash: string, now: Date) {
    const result = await this.prisma.emailVerification.updateMany({
      where: { tokenHash, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    if (result.count !== 1) return null;
    return this.prisma.emailVerification.findUnique({
      where: { tokenHash },
      select: { purpose: true, entityId: true, email: true },
    });
  }
}
