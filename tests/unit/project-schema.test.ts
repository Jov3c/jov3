import { describe, expect, it } from 'vitest';

import { projectSlugSchema, projectStatusSchema } from '../../shared/schemas/project';

describe('project schema contract', () => {
  it('accepts lowercase kebab-case project slugs', () => {
    expect(projectSlugSchema.safeParse('signal-daily').success).toBe(true);
    expect(projectSlugSchema.safeParse('Signal Daily').success).toBe(false);
    expect(projectSlugSchema.safeParse('-signal').success).toBe(false);
  });

  it('rejects route-reserved project slugs', () => {
    expect(projectSlugSchema.safeParse('archive').success).toBe(false);
    expect(projectSlugSchema.safeParse('new').success).toBe(false);
  });

  it('supports every documented project status', () => {
    expect(projectStatusSchema.options).toEqual(['BUILDING', 'ACTIVE', 'DONE', 'PAUSED']);
  });
});
