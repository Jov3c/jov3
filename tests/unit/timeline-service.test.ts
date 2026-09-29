import { describe, expect, it } from 'vitest';

import { TimelineError, TimelineService } from '../../server/services/timeline-service';

const entry = {
  id: '00000000-0000-4000-8000-000000000020',
  eventDate: new Date('2026-09-29T00:00:00.000Z'),
  datePrecision: 'MONTH' as const,
  title: 'A new chapter',
  bodyMarkdown: '# Keep building',
  sortOrder: 10,
  visible: true,
  createdAt: new Date('2026-09-29T00:00:00.000Z'),
  updatedAt: new Date('2026-09-29T00:00:00.000Z'),
  media: [
    {
      id: '00000000-0000-4000-8000-000000000021',
      sortOrder: 0,
      media: {
        id: '00000000-0000-4000-8000-000000000022',
        publicUrl: '/uploads/story.webp',
        altText: 'Story',
      },
    },
  ],
  links: [
    {
      id: '00000000-0000-4000-8000-000000000023',
      label: 'Site',
      url: 'https://example.com',
      sortOrder: 0,
    },
  ],
  projectRefs: [
    {
      id: '00000000-0000-4000-8000-000000000024',
      projectId: '00000000-0000-4000-8000-000000000025',
      sortOrder: 0,
      project: {
        id: '00000000-0000-4000-8000-000000000025',
        slug: 'signal-renamed',
        name: 'Signal Renamed',
        summary: 'Project',
        status: 'ACTIVE',
        visible: true,
      },
    },
  ],
};

describe('Timeline service', () => {
  it('formats precision, renders Markdown, and includes current public relations', async () => {
    const service = new TimelineService({ listPublic: async () => [entry] } as never);

    await expect(service.listPublic()).resolves.toEqual([
      expect.objectContaining({
        dateLabel: '2026.09',
        bodyHtml: '<h1>Keep building</h1>\n',
        media: [expect.objectContaining({ publicUrl: '/uploads/story.webp' })],
        links: [expect.objectContaining({ url: 'https://example.com' })],
        projects: [expect.objectContaining({ slug: 'signal-renamed', name: 'Signal Renamed' })],
      }),
    ]);
  });

  it('rejects relation IDs that are not present in the database', async () => {
    const service = new TimelineService({
      findMediaByIds: async () => [],
      findProjectsByIds: async () => [],
    } as never);

    await expect(
      service.create({
        eventDate: '2026-09-29',
        datePrecision: 'DAY',
        title: 'Invalid relation',
        bodyMarkdown: '',
        sortOrder: 0,
        visible: true,
        mediaIds: ['00000000-0000-4000-8000-000000000031'],
        links: [],
        projectIds: [],
      }),
    ).rejects.toMatchObject<TimelineError>({ code: 'MEDIA_NOT_FOUND' });
  });
});
