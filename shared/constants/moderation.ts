import { z } from 'zod';

export const MODERATION_STATUSES = [
  'PENDING_EMAIL',
  'PUBLISHED',
  'HIDDEN',
  'SPAM',
  'DELETED',
] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
  PENDING_EMAIL: '待邮箱验证',
  PUBLISHED: '已公开',
  HIDDEN: '已隐藏',
  SPAM: '垃圾内容',
  DELETED: '已删除',
};

export const moderationStatusSchema = z.enum(MODERATION_STATUSES);

export const MODERATION_ACTION_STATUSES = ['PUBLISHED', 'HIDDEN', 'SPAM'] as const;

export type ModerationActionStatus = (typeof MODERATION_ACTION_STATUSES)[number];

export const moderationActionStatusSchema = z.enum(MODERATION_ACTION_STATUSES);

export const AUTHOR_TYPES = ['VISITOR', 'ADMIN'] as const;

export type AuthorType = (typeof AUTHOR_TYPES)[number];
