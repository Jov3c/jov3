import { z } from 'zod';

export const MEDIA_CATEGORIES = [
  'avatars',
  'blog',
  'projects',
  'timeline',
  'footprint',
  'links',
  'general',
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const mediaCategorySchema = z.enum(MEDIA_CATEGORIES);
