import type { PrismaClient } from '../generated/prisma/client';

import type { AdminCommentListQuery, AdminMessageListQuery } from '../../shared/schemas/community';

const publicReplies = {
  where: { status: 'PUBLISHED' as const },
  orderBy: { createdAt: 'asc' as const },
} as const;

const publicMessageReplies = {
  where: { status: 'PUBLISHED' as const, isPrivate: false },
  orderBy: { createdAt: 'asc' as const },
} as const;

const adminCommentInclude = {
  post: { select: { id: true, slug: true, title: true } },
  parent: { select: { id: true, nickname: true } },
} as const;

const adminMessageInclude = {
  parent: { select: { id: true, nickname: true } },
} as const;

export class CommunityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findPublishedPostBySlug(slug: string) {
    return this.prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED', category: { visible: true } },
      select: { id: true, slug: true },
    });
  }

  async listPublicComments(postId: string, query: { page: number; pageSize: number }) {
    const [items, total, publishedTotal] = await Promise.all([
      this.prisma.articleComment.findMany({
        where: { postId, parentId: null, status: 'PUBLISHED' },
        include: { replies: publicReplies },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.articleComment.count({
        where: { postId, parentId: null, status: 'PUBLISHED' },
      }),
      this.prisma.articleComment.count({ where: { postId, status: 'PUBLISHED' } }),
    ]);
    return { items, total, publishedTotal };
  }

  countPublishedComments(postId: string) {
    return this.prisma.articleComment.count({ where: { postId, status: 'PUBLISHED' } });
  }

  findCommentById(id: string) {
    return this.prisma.articleComment.findUnique({ where: { id } });
  }

  createComment(input: {
    postId: string;
    parentId: string | null;
    nickname: string;
    email: string;
    content: string;
    ipHash: string;
  }) {
    return this.prisma.articleComment.create({
      data: {
        ...input,
        status: 'PENDING_EMAIL',
        authorType: 'VISITOR',
      },
    });
  }

  publishComment(id: string, email: string, verifiedAt: Date) {
    return this.prisma.articleComment.updateMany({
      where: { id, email, status: 'PENDING_EMAIL' },
      data: { status: 'PUBLISHED', verifiedAt },
    });
  }

  createCommentReply(input: { postId: string; parentId: string; content: string }) {
    return this.prisma.articleComment.create({
      data: {
        postId: input.postId,
        parentId: input.parentId,
        authorType: 'ADMIN',
        nickname: 'Jov3',
        email: null,
        content: input.content,
        status: 'PUBLISHED',
        verifiedAt: new Date(),
        ipHash: null,
      },
    });
  }

  async listAdminComments(query: AdminCommentListQuery) {
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.postId ? { postId: query.postId } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.articleComment.findMany({
        where,
        include: adminCommentInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.articleComment.count({ where }),
    ]);
    return { items, total };
  }

  updateCommentStatus(id: string, status: 'PUBLISHED' | 'HIDDEN' | 'SPAM') {
    return this.prisma.articleComment.update({
      where: { id },
      data: { status },
      include: adminCommentInclude,
    });
  }

  deleteComment(id: string) {
    return this.prisma.articleComment.delete({ where: { id } });
  }

  async listPublicMessages(query: { page: number; pageSize: number }) {
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { parentId: null, status: 'PUBLISHED', isPrivate: false },
        include: { replies: publicMessageReplies },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.message.count({
        where: { parentId: null, status: 'PUBLISHED', isPrivate: false },
      }),
    ]);
    return { items, total };
  }

  findMessageById(id: string) {
    return this.prisma.message.findUnique({ where: { id } });
  }

  createMessage(input: {
    nickname: string;
    email: string;
    content: string;
    isPrivate: boolean;
    ipHash: string;
  }) {
    return this.prisma.message.create({
      data: { ...input, status: 'PENDING_EMAIL', authorType: 'VISITOR' },
    });
  }

  publishMessage(id: string, email: string, verifiedAt: Date) {
    return this.prisma.message.updateMany({
      where: { id, email, status: 'PENDING_EMAIL' },
      data: { status: 'PUBLISHED', verifiedAt },
    });
  }

  createMessageReply(input: { parentId: string; content: string; isPrivate: boolean }) {
    return this.prisma.message.create({
      data: {
        parentId: input.parentId,
        authorType: 'ADMIN',
        nickname: 'Jov3',
        email: null,
        content: input.content,
        isPrivate: input.isPrivate,
        status: 'PUBLISHED',
        verifiedAt: new Date(),
        ipHash: null,
      },
    });
  }

  async listAdminMessages(query: AdminMessageListQuery) {
    const where = query.status ? { status: query.status } : {};
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: adminMessageInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.message.count({ where }),
    ]);
    return { items, total };
  }

  updateMessageStatus(id: string, status: 'PUBLISHED' | 'HIDDEN' | 'SPAM') {
    return this.prisma.message.update({
      where: { id },
      data: { status },
      include: adminMessageInclude,
    });
  }

  deleteMessage(id: string) {
    return this.prisma.message.delete({ where: { id } });
  }
}
