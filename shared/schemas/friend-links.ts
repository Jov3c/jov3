import { z } from 'zod';

import { FRIEND_LINK_STATUSES } from '../constants/friend-links';

const externalUrlSchema = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'Use HTTP or HTTPS');

const mediaIdSchema = z.string().uuid().nullable().optional().default(null);

export const friendLinkApplySchema = z.object({
  websiteName: z.string().trim().min(1).max(120),
  websiteUrl: externalUrlSchema,
  logoMediaId: mediaIdSchema,
  description: z.string().trim().min(1).max(300),
  contactEmail: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  note: z.string().trim().max(500).default(''),
});

export const friendLinkStatusSchema = z.enum(FRIEND_LINK_STATUSES);

export const friendLinkListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  status: friendLinkStatusSchema.optional(),
});

export const adminFriendLinkCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: externalUrlSchema,
  logoMediaId: mediaIdSchema,
  description: z.string().trim().min(1).max(300),
  sortOrder: z.coerce.number().int().min(-100_000).max(100_000).default(0),
  visible: z.boolean().default(true),
  status: friendLinkStatusSchema.default('PUBLISHED'),
});

export const adminFriendLinkUpdateSchema = adminFriendLinkCreateSchema
  .omit({ status: true })
  .partial();

export type FriendLinkApplyInput = z.infer<typeof friendLinkApplySchema>;
export type FriendLinkListQuery = z.infer<typeof friendLinkListQuerySchema>;
export type AdminFriendLinkCreateInput = z.infer<typeof adminFriendLinkCreateSchema>;
export type AdminFriendLinkUpdateInput = z.infer<typeof adminFriendLinkUpdateSchema>;
