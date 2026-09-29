import { z } from 'zod';

import { moderationActionStatusSchema, moderationStatusSchema } from '../constants/moderation';

const nicknameSchema = z.string().trim().min(1).max(80);
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const contentSchema = z.string().trim().min(1).max(4_000);
const pageSchema = z.coerce.number().int().min(1).max(10_000).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(50).default(20);

export const commentCreateSchema = z.object({
  nickname: nicknameSchema,
  email: emailSchema,
  content: contentSchema,
  parentId: z.string().uuid().nullable().optional().default(null),
});

export const messageCreateSchema = z.object({
  nickname: nicknameSchema,
  email: emailSchema,
  content: contentSchema,
});

export const publicCommunityListQuerySchema = z.object({
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const adminCommentListQuerySchema = z.object({
  status: moderationStatusSchema.optional(),
  postId: z.string().uuid().optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const adminMessageListQuerySchema = z.object({
  status: moderationStatusSchema.optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const moderationStatusUpdateSchema = z.object({
  status: moderationActionStatusSchema,
});

export const adminReplySchema = z.object({
  content: contentSchema,
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type PublicCommunityListQuery = z.infer<typeof publicCommunityListQuerySchema>;
export type AdminCommentListQuery = z.infer<typeof adminCommentListQuerySchema>;
export type AdminMessageListQuery = z.infer<typeof adminMessageListQuerySchema>;
export type ModerationStatusUpdateInput = z.infer<typeof moderationStatusUpdateSchema>;
export type AdminReplyInput = z.infer<typeof adminReplySchema>;
