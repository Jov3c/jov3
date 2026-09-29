import type { ArticleComment, Message } from '../generated/prisma/client';

import type { ModerationActionStatus } from '../../shared/constants/moderation';
import {
  adminReplySchema,
  commentCreateSchema,
  messageCreateSchema,
  type AdminCommentListQuery,
  type AdminMessageListQuery,
  type CommentCreateInput,
  type MessageCreateInput,
} from '../../shared/schemas/community';
import type { EmailVerificationPurpose } from '../../shared/constants/email-verification';
import type { CommunityRepository } from '../repositories/community-repository';
import type { EmailVerificationService } from './email-verification-service';

export class CommunityError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'CommunityError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

type PublicCommentRecord = Awaited<
  ReturnType<CommunityRepository['listPublicComments']>
>['items'][number];
type AdminCommentRecord = Awaited<
  ReturnType<CommunityRepository['listAdminComments']>
>['items'][number];
type PublicMessageRecord = Awaited<
  ReturnType<CommunityRepository['listPublicMessages']>
>['items'][number];
type AdminMessageRecord = Awaited<
  ReturnType<CommunityRepository['listAdminMessages']>
>['items'][number];

export class CommunityService {
  constructor(
    private readonly repository: CommunityRepository,
    private readonly emailVerification?: EmailVerificationService,
  ) {}

  async submitComment(slug: string, input: CommentCreateInput, ipHash: string) {
    const parsed = commentCreateSchema.safeParse(input);
    if (!parsed.success)
      throw new CommunityError(400, 'INVALID_COMMENT', 'Comment fields are invalid');

    const post = await this.repository.findPublishedPostBySlug(slug.trim().toLowerCase());
    if (!post) throw new CommunityError(404, 'POST_NOT_FOUND', 'Post not found');

    const parentId = parsed.data.parentId ?? null;
    if (parentId) await this.ensureCommentParent(parentId, post.id);

    const email = parsed.data.email.trim().toLowerCase();
    const comment = await this.repository.createComment({
      postId: post.id,
      parentId,
      nickname: parsed.data.nickname.trim(),
      email,
      content: parsed.data.content.trim(),
      ipHash,
    });
    try {
      const verification = await this.issueVerification('COMMENT', comment.id, email);
      return {
        id: comment.id,
        verificationRequired: true,
        expiresAt: verification.expiresAt.toISOString(),
      };
    } catch (error) {
      await this.repository.deleteComment(comment.id).catch(() => undefined);
      throw error;
    }
  }

  async listPublicComments(slug: string, query: { page: number; pageSize: number }) {
    const post = await this.repository.findPublishedPostBySlug(slug.trim().toLowerCase());
    if (!post) throw new CommunityError(404, 'POST_NOT_FOUND', 'Post not found');
    const result = await this.repository.listPublicComments(post.id, query);
    return {
      items: result.items.map(toPublicCommentDto),
      total: result.total,
      publishedTotal: result.publishedTotal,
    };
  }

  async submitMessage(input: MessageCreateInput, ipHash: string) {
    const parsed = messageCreateSchema.safeParse(input);
    if (!parsed.success)
      throw new CommunityError(400, 'INVALID_MESSAGE', 'Message fields are invalid');

    const email = parsed.data.email.trim().toLowerCase();
    const message = await this.repository.createMessage({
      nickname: parsed.data.nickname.trim(),
      email,
      content: parsed.data.content.trim(),
      ipHash,
    });
    try {
      const verification = await this.issueVerification('MESSAGE', message.id, email);
      return {
        id: message.id,
        verificationRequired: true,
        expiresAt: verification.expiresAt.toISOString(),
      };
    } catch (error) {
      await this.repository.deleteMessage(message.id).catch(() => undefined);
      throw error;
    }
  }

  async listPublicMessages(query: { page: number; pageSize: number }) {
    const result = await this.repository.listPublicMessages(query);
    return { items: result.items.map(toPublicMessageDto), total: result.total };
  }

  async completeEmailVerification(input: {
    purpose: EmailVerificationPurpose;
    entityId: string;
    email: string;
    verifiedAt: Date;
  }) {
    const email = input.email.trim().toLowerCase();
    if (input.purpose === 'COMMENT') {
      const comment = await this.repository.findCommentById(input.entityId);
      if (!comment || comment.email !== email) {
        throw new CommunityError(404, 'VERIFICATION_TARGET_NOT_FOUND', 'Comment not found');
      }
      await this.repository.publishComment(input.entityId, email, input.verifiedAt);
      return { published: true, purpose: input.purpose };
    }
    if (input.purpose === 'MESSAGE') {
      const message = await this.repository.findMessageById(input.entityId);
      if (!message || message.email !== email) {
        throw new CommunityError(404, 'VERIFICATION_TARGET_NOT_FOUND', 'Message not found');
      }
      await this.repository.publishMessage(input.entityId, email, input.verifiedAt);
      return { published: true, purpose: input.purpose };
    }
    return { published: false, purpose: input.purpose };
  }

  async listAdminComments(query: AdminCommentListQuery) {
    const result = await this.repository.listAdminComments(query);
    return { items: result.items.map(toAdminCommentDto), total: result.total };
  }

  async updateCommentStatus(id: string, status: ModerationActionStatus) {
    const comment = await this.repository.findCommentById(id);
    if (!comment) throw new CommunityError(404, 'COMMENT_NOT_FOUND', 'Comment not found');
    ensurePublishable(comment, status, 'comment');
    try {
      return toAdminCommentDto(await this.repository.updateCommentStatus(id, status));
    } catch (error) {
      throw mapNotFound(error, 'COMMENT_NOT_FOUND', 'Comment not found');
    }
  }

  async replyToComment(id: string, content: string) {
    const parsed = adminReplySchema.safeParse({ content });
    if (!parsed.success) throw new CommunityError(400, 'INVALID_REPLY', 'Reply is invalid');
    const parent = await this.repository.findCommentById(id);
    if (!parent) throw new CommunityError(404, 'COMMENT_NOT_FOUND', 'Comment not found');
    if (parent.parentId) {
      throw new CommunityError(400, 'REPLY_DEPTH_EXCEEDED', 'Only one reply level is supported');
    }
    if (parent.status !== 'PUBLISHED') {
      throw new CommunityError(
        409,
        'COMMENT_NOT_PUBLIC',
        'Only public comments can receive replies',
      );
    }
    return toAdminCommentDto(
      await this.repository.createCommentReply({
        postId: parent.postId,
        parentId: parent.id,
        content: parsed.data.content.trim(),
      }),
    );
  }

  async deleteComment(id: string) {
    await this.findCommentOrThrow(id);
    await this.repository.deleteComment(id);
    return { deleted: true };
  }

  async listAdminMessages(query: AdminMessageListQuery) {
    const result = await this.repository.listAdminMessages(query);
    return { items: result.items.map(toAdminMessageDto), total: result.total };
  }

  async updateMessageStatus(id: string, status: ModerationActionStatus) {
    const message = await this.repository.findMessageById(id);
    if (!message) throw new CommunityError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
    ensurePublishable(message, status, 'message');
    try {
      return toAdminMessageDto(await this.repository.updateMessageStatus(id, status));
    } catch (error) {
      throw mapNotFound(error, 'MESSAGE_NOT_FOUND', 'Message not found');
    }
  }

  async replyToMessage(id: string, content: string) {
    const parsed = adminReplySchema.safeParse({ content });
    if (!parsed.success) throw new CommunityError(400, 'INVALID_REPLY', 'Reply is invalid');
    const parent = await this.repository.findMessageById(id);
    if (!parent) throw new CommunityError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
    if (parent.parentId) {
      throw new CommunityError(400, 'REPLY_DEPTH_EXCEEDED', 'Only one reply level is supported');
    }
    if (parent.status !== 'PUBLISHED') {
      throw new CommunityError(
        409,
        'MESSAGE_NOT_PUBLIC',
        'Only public messages can receive replies',
      );
    }
    return toAdminMessageDto(
      await this.repository.createMessageReply({
        parentId: parent.id,
        content: parsed.data.content.trim(),
      }),
    );
  }

  async deleteMessage(id: string) {
    await this.findMessageOrThrow(id);
    await this.repository.deleteMessage(id);
    return { deleted: true };
  }

  private async issueVerification(purpose: 'COMMENT' | 'MESSAGE', entityId: string, email: string) {
    if (!this.emailVerification) {
      throw new CommunityError(503, 'EMAIL_NOT_CONFIGURED', 'Email delivery is not configured');
    }
    return this.emailVerification.issue({ purpose, entityId, email });
  }

  private async ensureCommentParent(parentId: string, postId: string) {
    const parent = await this.repository.findCommentById(parentId);
    if (
      !parent ||
      parent.postId !== postId ||
      parent.parentId !== null ||
      parent.status !== 'PUBLISHED'
    ) {
      throw new CommunityError(400, 'INVALID_COMMENT_PARENT', 'Comment reply target is invalid');
    }
  }

  private async findCommentOrThrow(id: string) {
    const comment = await this.repository.findCommentById(id);
    if (!comment) throw new CommunityError(404, 'COMMENT_NOT_FOUND', 'Comment not found');
    return comment;
  }

  private async findMessageOrThrow(id: string) {
    const message = await this.repository.findMessageById(id);
    if (!message) throw new CommunityError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
    return message;
  }
}

export function communityApiError(error: unknown) {
  if (error instanceof CommunityError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  return null;
}

function ensurePublishable(
  record: Pick<ArticleComment | Message, 'status' | 'verifiedAt' | 'authorType'>,
  status: ModerationActionStatus,
  label: string,
) {
  if (status === 'PUBLISHED' && record.authorType !== 'ADMIN' && !record.verifiedAt) {
    throw new CommunityError(409, 'EMAIL_NOT_VERIFIED', `This ${label} email is not verified`);
  }
}

function toPublicCommentDto(record: PublicCommentRecord) {
  return {
    id: record.id,
    nickname: record.nickname,
    content: record.content,
    authorType: record.authorType,
    createdAt: record.createdAt.toISOString(),
    replies: record.replies.map((reply) => ({
      id: reply.id,
      nickname: reply.nickname,
      content: reply.content,
      authorType: reply.authorType,
      createdAt: reply.createdAt.toISOString(),
    })),
  };
}

function toAdminCommentDto(record: AdminCommentRecord | ArticleComment) {
  return {
    id: record.id,
    postId: 'postId' in record ? record.postId : undefined,
    post: 'post' in record ? record.post : undefined,
    parentId: record.parentId,
    parent: 'parent' in record ? record.parent : undefined,
    nickname: record.nickname,
    email: record.email,
    content: record.content,
    authorType: record.authorType,
    status: record.status,
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toPublicMessageDto(record: PublicMessageRecord) {
  return {
    id: record.id,
    nickname: record.nickname,
    content: record.content,
    authorType: record.authorType,
    createdAt: record.createdAt.toISOString(),
    replies: record.replies.map((reply) => ({
      id: reply.id,
      nickname: reply.nickname,
      content: reply.content,
      authorType: reply.authorType,
      createdAt: reply.createdAt.toISOString(),
    })),
  };
}

function toAdminMessageDto(record: AdminMessageRecord | Message) {
  return {
    id: record.id,
    parentId: record.parentId,
    parent: 'parent' in record ? record.parent : undefined,
    nickname: record.nickname,
    email: record.email,
    content: record.content,
    authorType: record.authorType,
    status: record.status,
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapNotFound(error: unknown, code: string, message: string) {
  if (error instanceof Error && 'code' in error && error.code === 'P2025') {
    return new CommunityError(404, code, message);
  }
  return error;
}
