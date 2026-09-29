import { z } from 'zod';

export const ENTRY_TARGET_TYPES = ['INTERNAL', 'EXTERNAL'] as const;

export type EntryTargetType = (typeof ENTRY_TARGET_TYPES)[number];

export const entryTargetTypeSchema = z.enum(ENTRY_TARGET_TYPES);
