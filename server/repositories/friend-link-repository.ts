import type { PrismaClient } from '../generated/prisma/client';

import type { FriendLinkListQuery } from '../../shared/schemas/friend-links';

const logoMediaInclude = {
  logoMedia: { select: { id: true, publicUrl: true, altText: true } },
} as const;

export class FriendLinkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMediaById(id: string) {
    return this.prisma.mediaAsset.findUnique({ where: { id }, select: { id: true } });
  }

  async listPublic(query: Pick<FriendLinkListQuery, 'page' | 'pageSize'>) {
    const where = { status: 'PUBLISHED' as const, visible: true };
    const [items, total] = await Promise.all([
      this.prisma.friendLink.findMany({
        where,
        include: logoMediaInclude,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.friendLink.count({ where }),
    ]);
    return { items, total };
  }

  async listAdmin(query: FriendLinkListQuery) {
    const where = query.status ? { status: query.status } : {};
    const [items, total] = await Promise.all([
      this.prisma.friendLink.findMany({
        where,
        include: logoMediaInclude,
        orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.friendLink.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return this.prisma.friendLink.findUnique({ where: { id }, include: logoMediaInclude });
  }

  createApplication(input: {
    name: string;
    url: string;
    description: string;
    logoMediaId: string | null;
    contactEmail: string;
    applicantNote: string | null;
  }) {
    return this.prisma.friendLink.create({
      data: {
        ...input,
        source: 'APPLICATION',
        status: 'PENDING_EMAIL',
        verifiedAt: null,
        visible: false,
      },
      include: logoMediaInclude,
    });
  }

  createAdmin(input: {
    name: string;
    url: string;
    description: string;
    logoMediaId: string | null;
    sortOrder: number;
    visible: boolean;
    status: 'PUBLISHED' | 'REJECTED' | 'PENDING_EMAIL' | 'PENDING_REVIEW';
  }) {
    return this.prisma.friendLink.create({
      data: {
        ...input,
        source: 'ADMIN',
        contactEmail: null,
        applicantNote: null,
        verifiedAt: null,
      },
      include: logoMediaInclude,
    });
  }

  moveToPendingReview(id: string, email: string, verifiedAt: Date) {
    return this.prisma.friendLink.updateMany({
      where: { id, contactEmail: email, status: 'PENDING_EMAIL' },
      data: { status: 'PENDING_REVIEW', visible: false, verifiedAt },
    });
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      url: string;
      description: string;
      logoMediaId: string | null;
      sortOrder: number;
      visible: boolean;
    }>,
  ) {
    return this.prisma.friendLink.update({ where: { id }, data, include: logoMediaInclude });
  }

  approve(id: string) {
    return this.prisma.friendLink.update({
      where: { id },
      data: { status: 'PUBLISHED', visible: true },
      include: logoMediaInclude,
    });
  }

  reject(id: string) {
    return this.prisma.friendLink.update({
      where: { id },
      data: { status: 'REJECTED', visible: false },
      include: logoMediaInclude,
    });
  }

  delete(id: string) {
    return this.prisma.friendLink.delete({ where: { id } });
  }
}
