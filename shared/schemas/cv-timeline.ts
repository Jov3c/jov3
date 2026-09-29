import { z } from 'zod';

import { DATE_PRECISIONS } from '../constants/about';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const httpUrlSchema = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'Use HTTP or HTTPS');

const optionalHttpUrlSchema = httpUrlSchema.nullable();

export const cvProfileSchema = z.object({
  isPublic: z.boolean(),
  name: z.string().trim().min(1).max(120),
  headline: z.string().trim().min(1).max(180),
  bio: z.string().trim().min(1).max(20_000),
  location: z.string().trim().min(1).max(120),
  website: optionalHttpUrlSchema,
  statusText: z.string().trim().max(120).nullable(),
  statement: z.string().trim().min(1).max(20_000),
  portraitMediaId: z.string().uuid().nullable(),
});

export const cvProfileUpdateSchema = cvProfileSchema.partial();

export const cvExperienceSchema = z.object({
  company: z.string().trim().min(1).max(180),
  role: z.string().trim().min(1).max(180),
  location: z.string().trim().min(1).max(120),
  startDate: dateSchema,
  endDate: dateSchema.nullable(),
  isCurrent: z.boolean(),
  description: z.string().trim().min(1).max(20_000),
  sortOrder: z.number().int().min(0).max(100_000),
});

export const cvExperienceUpdateSchema = cvExperienceSchema.partial();

export const cvEducationSchema = z.object({
  school: z.string().trim().min(1).max(180),
  major: z.string().trim().min(1).max(180),
  degree: z.string().trim().min(1).max(120),
  startDate: dateSchema,
  endDate: dateSchema.nullable(),
  description: z.string().trim().min(1).max(20_000),
  sortOrder: z.number().int().min(0).max(100_000),
});

export const cvEducationUpdateSchema = cvEducationSchema.partial();

export const cvSkillGroupSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(20_000),
  sortOrder: z.number().int().min(0).max(100_000),
});

export const cvSkillGroupUpdateSchema = cvSkillGroupSchema.partial();

export const cvProjectRefsSchema = z.object({
  projectIds: z.array(z.string().uuid()).max(100),
});

export const timelineLinkSchema = z.object({
  label: z.string().trim().min(1).max(120),
  url: httpUrlSchema,
  sortOrder: z.number().int().min(0).max(100_000),
});

const relationIdsSchema = z.array(z.string().uuid()).max(100);

export const timelineEntrySchema = z.object({
  eventDate: dateSchema,
  datePrecision: z.enum(DATE_PRECISIONS),
  title: z.string().trim().min(1).max(180),
  bodyMarkdown: z.string().max(200_000),
  sortOrder: z.number().int().min(0).max(100_000),
  visible: z.boolean(),
  mediaIds: relationIdsSchema,
  links: z.array(timelineLinkSchema).max(30),
  projectIds: relationIdsSchema,
});

export const timelineEntryUpdateSchema = timelineEntrySchema.partial();

export type CvProfileInput = z.infer<typeof cvProfileSchema>;
export type CvProfileUpdateInput = z.infer<typeof cvProfileUpdateSchema>;
export type CvExperienceInput = z.infer<typeof cvExperienceSchema>;
export type CvExperienceUpdateInput = z.infer<typeof cvExperienceUpdateSchema>;
export type CvEducationInput = z.infer<typeof cvEducationSchema>;
export type CvEducationUpdateInput = z.infer<typeof cvEducationUpdateSchema>;
export type CvSkillGroupInput = z.infer<typeof cvSkillGroupSchema>;
export type CvSkillGroupUpdateInput = z.infer<typeof cvSkillGroupUpdateSchema>;
export type CvProjectRefsInput = z.infer<typeof cvProjectRefsSchema>;
export type TimelineEntryInput = z.infer<typeof timelineEntrySchema>;
export type TimelineEntryUpdateInput = z.infer<typeof timelineEntryUpdateSchema>;
