import { z } from 'zod';

import { isReservedProjectSlug, PROJECT_STATUSES } from '../constants/project';

const httpUrlSchema = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'Use HTTP or HTTPS');

export const projectStatusSchema = z.enum(PROJECT_STATUSES);

export const projectSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case')
  .refine((value) => !isReservedProjectSlug(value), 'This slug is reserved');

export const projectSchema = z.object({
  slug: projectSlugSchema,
  name: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(400),
  status: projectStatusSchema,
  techStack: z.array(z.string().trim().min(1).max(60)).max(20),
  githubUrl: httpUrlSchema.nullable(),
  demoUrl: httpUrlSchema.nullable(),
  readmeMarkdown: z.string().max(200_000),
  sortOrder: z.number().int().min(0).max(100_000),
  visible: z.boolean(),
});

export const projectCreateSchema = projectSchema;
export const projectUpdateSchema = projectSchema.partial();
export const projectReorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectReorderInput = z.infer<typeof projectReorderSchema>;
export type ProjectStatusInput = z.infer<typeof projectStatusSchema>;
