import { z } from 'zod';

import { entryTargetTypeSchema } from '../constants/home';

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const optionalEmailSchema = z.union([
  z.string().trim().toLowerCase().email().max(254),
  z.literal(''),
]);

export const siteProfileSchema = z.object({
  siteTitle: z.string().trim().min(1).max(120),
  siteDescription: z.string().trim().min(1).max(300),
  foundedAt: dateOnlySchema,
  publicContactEmail: optionalEmailSchema.nullable(),
});

export const homeProfileSchema = z.object({
  nickname: z.string().trim().min(1).max(80),
  role: z.string().trim().min(1).max(160),
  intro: z.string().trim().min(1).max(2_000),
  avatarMediaId: z.string().uuid().nullable(),
  statusText: z.string().trim().max(120).nullable(),
  statusVisible: z.boolean(),
});

export const homeEntrySchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(180),
  icon: z.string().trim().max(80).nullable(),
  url: z.string().trim().min(1).max(500),
  targetType: entryTargetTypeSchema,
  openNewTab: z.boolean(),
  sortOrder: z.number().int().min(0).max(100_000),
  visible: z.boolean(),
});

export const socialLinkSchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(80).nullable(),
  url: z.string().trim().min(1).max(500),
  sortOrder: z.number().int().min(0).max(100_000),
  visible: z.boolean(),
});

export const siteProfileUpdateSchema = siteProfileSchema.partial();
export const homeProfileUpdateSchema = homeProfileSchema.partial();
export const homeEntryCreateSchema = homeEntrySchema;
export const homeEntryUpdateSchema = homeEntrySchema.partial();
export const socialLinkCreateSchema = socialLinkSchema;
export const socialLinkUpdateSchema = socialLinkSchema.partial();

export type SiteProfileInput = z.infer<typeof siteProfileSchema>;
export type HomeProfileInput = z.infer<typeof homeProfileSchema>;
export type HomeEntryInput = z.infer<typeof homeEntrySchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
