import { z } from 'zod';

export const visitPingSchema = z.object({
  path: z.string().trim().min(1).max(500),
});

export type VisitPingInput = z.infer<typeof visitPingSchema>;
