import { describe, expect, it } from 'vitest';

import {
  cvExperienceSchema,
  cvProfileUpdateSchema,
  timelineEntrySchema,
} from '../../shared/schemas/cv-timeline';

describe('CV and Timeline schemas', () => {
  it('normalizes a partial CV profile update without losing the public switch', () => {
    const result = cvProfileUpdateSchema.parse({
      isPublic: false,
      name: '  Jov3  ',
      website: 'https://jov3.cloud',
      portraitMediaId: null,
    });

    expect(result).toMatchObject({
      isPublic: false,
      name: 'Jov3',
      website: 'https://jov3.cloud',
      portraitMediaId: null,
    });
  });

  it('allows an open-ended experience and rejects an unsafe website', () => {
    expect(
      cvExperienceSchema.parse({
        company: 'JOV3',
        role: 'Builder',
        location: 'Chengdu',
        startDate: '2025-06-01',
        endDate: null,
        isCurrent: true,
        description: 'Build useful systems.',
        sortOrder: 10,
      }),
    ).toMatchObject({ isCurrent: true, endDate: null });

    expect(() => cvProfileUpdateSchema.parse({ website: 'javascript:alert(1)' })).toThrow();
  });

  it('validates timeline precision, safe links, and ordered relations', () => {
    const result = timelineEntrySchema.parse({
      eventDate: '2026-09-29',
      datePrecision: 'MONTH',
      title: 'A new chapter',
      bodyMarkdown: 'Keep building.',
      sortOrder: 20,
      visible: true,
      mediaIds: [],
      links: [{ label: 'Site', url: 'https://example.com', sortOrder: 0 }],
      projectIds: ['00000000-0000-4000-8000-000000000001'],
    });

    expect(result.datePrecision).toBe('MONTH');
    expect(result.links[0]?.url).toBe('https://example.com');
    expect(() =>
      timelineEntrySchema.parse({
        eventDate: '2026-09-29',
        datePrecision: 'DAY',
        title: 'Unsafe link',
        bodyMarkdown: '',
        sortOrder: 0,
        visible: true,
        mediaIds: [],
        links: [{ label: 'Bad', url: 'javascript:alert(1)', sortOrder: 0 }],
        projectIds: [],
      }),
    ).toThrow();
  });
});
