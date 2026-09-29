import { z } from 'zod';

import { isReservedBlogSlug, POST_STATUSES } from '../constants/blog';

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case')
  .refine((value) => !isReservedBlogSlug(value), 'This slug is reserved');

const categorySlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case');

export const postStatusSchema = z.enum(POST_STATUSES);

export const categoryCreateSchema = z.object({
  slug: categorySlugSchema,
  name: z.string().trim().min(1).max(80),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
  visible: z.boolean().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const postSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(220),
  excerpt: z.string().trim().min(1).max(500),
  categoryId: z.string().uuid(),
  coverMediaId: z.string().uuid().nullable(),
  markdownBody: z.string().max(500_000),
  status: postStatusSchema,
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
  seoTitle: z.string().trim().max(220).nullable(),
  seoDescription: z.string().trim().max(320).nullable(),
});

export const postCreateSchema = postSchema;
export const postUpdateSchema = postSchema.partial();

export const postListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().trim().max(80).default(''),
});

export const adminPostListQuerySchema = postListQuerySchema.extend({
  status: postStatusSchema.optional(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type PostCreateInput = z.infer<typeof postCreateSchema>;
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;
export type PostListQuery = z.infer<typeof postListQuerySchema>;
export type AdminPostListQuery = z.infer<typeof adminPostListQuerySchema>;
export type PostStatusInput = z.infer<typeof postStatusSchema>;
