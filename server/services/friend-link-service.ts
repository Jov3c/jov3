import type { FriendLink } from '../generated/prisma/client';

import type { EmailVerificationPurpose } from '../../shared/constants/email-verification';
import {
  adminFriendLinkCreateSchema,
  adminFriendLinkUpdateSchema,
  friendLinkApplySchema,
  friendLinkListQuerySchema,
  type AdminFriendLinkCreateInput,
  type AdminFriendLinkUpdateInput,
  type FriendLinkApplyInput,
  type FriendLinkListQuery,
} from '../../shared/schemas/friend-links';
import type { FriendLinkRepository } from '../repositories/friend-link-repository';
import type { EmailVerificationService } from './email-verification-service';

export class FriendLinkError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'FriendLinkError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

type FriendLinkRecord = Awaited<ReturnType<FriendLinkRepository['findById']>>;
type ListedFriendLink = Awaited<ReturnType<FriendLinkRepository['listPublic']>>['items'][number];

export class FriendLinkService {
  constructor(
    private readonly repository: FriendLinkRepository,
    private readonly emailVerification?: EmailVerificationService,
  ) {}

  async apply(input: FriendLinkApplyInput, _ipHash: string) {
    const parsed = friendLinkApplySchema.safeParse(input);
    if (!parsed.success) {
      throw new FriendLinkError(400, 'INVALID_FRIEND_LINK', 'Friend link fields are invalid');
    }
    await this.ensureLogoMedia(parsed.data.logoMediaId);

    const record = await this.repository.createApplication({
      name: parsed.data.websiteName,
      url: parsed.data.websiteUrl,
      description: parsed.data.description,
      logoMediaId: parsed.data.logoMediaId,
      contactEmail: parsed.data.contactEmail,
      applicantNote: parsed.data.note || null,
    });

    try {
      const verification = await this.issueVerification(record.id, parsed.data.contactEmail);
      return {
        id: record.id,
        verificationRequired: true,
        expiresAt: verification.expiresAt.toISOString(),
      };
    } catch (error) {
      await this.repository.delete(record.id).catch(() => undefined);
      throw error;
    }
  }

  async listPublicLinks(query: Pick<FriendLinkListQuery, 'page' | 'pageSize'>) {
    const parsed = friendLinkListQuerySchema.safeParse(query);
    if (!parsed.success)
      throw new FriendLinkError(400, 'INVALID_QUERY', 'Friend link query is invalid');
    const result = await this.repository.listPublic(parsed.data);
    return { items: result.items.map(toPublicDto), total: result.total };
  }

  async listAdminLinks(query: FriendLinkListQuery) {
    const parsed = friendLinkListQuerySchema.safeParse(query);
    if (!parsed.success)
      throw new FriendLinkError(400, 'INVALID_QUERY', 'Friend link query is invalid');
    const result = await this.repository.listAdmin(parsed.data);
    return { items: result.items.map(toAdminDto), total: result.total };
  }

  async completeEmailVerification(input: {
    purpose: EmailVerificationPurpose;
    entityId: string;
    email: string;
    verifiedAt: Date;
  }) {
    if (input.purpose !== 'FRIEND_LINK') return { status: 'IGNORED', purpose: input.purpose };
    const email = input.email.trim().toLowerCase();
    const result = await this.repository.moveToPendingReview(
      input.entityId,
      email,
      input.verifiedAt,
    );
    if (result.count !== 1) {
      throw new FriendLinkError(
        404,
        'VERIFICATION_TARGET_NOT_FOUND',
        'Friend link application not found',
      );
    }
    return { status: 'PENDING_REVIEW', purpose: input.purpose };
  }

  async createAdmin(input: AdminFriendLinkCreateInput) {
    const parsed = adminFriendLinkCreateSchema.safeParse(input);
    if (!parsed.success) {
      throw new FriendLinkError(400, 'INVALID_FRIEND_LINK', 'Friend link fields are invalid');
    }
    await this.ensureLogoMedia(parsed.data.logoMediaId);
    return toAdminDto(
      await this.repository.createAdmin({
        ...parsed.data,
        logoMediaId: parsed.data.logoMediaId,
      }),
    );
  }

  async update(id: string, input: AdminFriendLinkUpdateInput) {
    await this.findOrThrow(id);
    const parsed = adminFriendLinkUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new FriendLinkError(400, 'INVALID_FRIEND_LINK', 'Friend link fields are invalid');
    }
    if (parsed.data.logoMediaId !== undefined) await this.ensureLogoMedia(parsed.data.logoMediaId);
    try {
      return toAdminDto(await this.repository.update(id, parsed.data));
    } catch (error) {
      throw mapNotFound(error);
    }
  }

  async approve(id: string) {
    const record = await this.findOrThrow(id);
    if (record.status !== 'PENDING_REVIEW') {
      throw new FriendLinkError(
        409,
        'INVALID_STATUS_TRANSITION',
        'Only pending reviews can be approved',
      );
    }
    return toAdminDto(await this.repository.approve(id));
  }

  async reject(id: string) {
    const record = await this.findOrThrow(id);
    if (record.status !== 'PENDING_REVIEW') {
      throw new FriendLinkError(
        409,
        'INVALID_STATUS_TRANSITION',
        'Only pending reviews can be rejected',
      );
    }
    return toAdminDto(await this.repository.reject(id));
  }

  async delete(id: string) {
    await this.findOrThrow(id);
    await this.repository.delete(id);
    return { deleted: true };
  }

  private async issueVerification(entityId: string, email: string) {
    if (!this.emailVerification) {
      throw new FriendLinkError(503, 'EMAIL_NOT_CONFIGURED', 'Email delivery is not configured');
    }
    return this.emailVerification.issue({ purpose: 'FRIEND_LINK', entityId, email });
  }

  private async ensureLogoMedia(id: string | null) {
    if (!id) return;
    if (!(await this.repository.findMediaById(id))) {
      throw new FriendLinkError(400, 'LOGO_MEDIA_NOT_FOUND', 'Logo media asset not found');
    }
  }

  private async findOrThrow(id: string) {
    const record = await this.repository.findById(id);
    if (!record) throw new FriendLinkError(404, 'FRIEND_LINK_NOT_FOUND', 'Friend link not found');
    return record;
  }
}

export function friendLinkApiError(error: unknown) {
  if (error instanceof FriendLinkError) {
    return { statusCode: error.statusCode, code: error.code, message: error.message };
  }
  return null;
}

function toPublicDto(record: ListedFriendLink) {
  return {
    id: record.id,
    name: record.name,
    url: record.url,
    description: record.description,
    logo: record.logoMedia
      ? {
          id: record.logoMedia.id,
          publicUrl: record.logoMedia.publicUrl,
          altText: record.logoMedia.altText,
        }
      : null,
    sortOrder: record.sortOrder,
    visible: record.visible,
    createdAt: record.createdAt.toISOString(),
  };
}

function toAdminDto(record: NonNullable<FriendLinkRecord> | FriendLink) {
  return {
    ...toPublicDto(record as ListedFriendLink),
    logoMediaId: record.logoMediaId,
    contactEmail: record.contactEmail,
    applicantNote: record.applicantNote,
    source: record.source,
    status: record.status,
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapNotFound(error: unknown) {
  if (error instanceof Error && 'code' in error && error.code === 'P2025') {
    return new FriendLinkError(404, 'FRIEND_LINK_NOT_FOUND', 'Friend link not found');
  }
  return error;
}
