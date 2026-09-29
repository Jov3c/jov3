export const PROJECT_NAME = 'JOV3' as const;

export const PROJECT_STATUSES = ['BUILDING', 'ACTIVE', 'DONE', 'PAUSED'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  BUILDING: 'Building',
  ACTIVE: 'Active',
  DONE: 'Done',
  PAUSED: 'Paused',
};

export const PROJECT_RESERVED_SLUGS = [
  'new',
  'admin',
  'api',
  'archive',
  'links',
  'message',
  'footprint',
  'about',
  'blog',
  'projects',
  'verify',
] as const;

export function isReservedProjectSlug(slug: string) {
  return PROJECT_RESERVED_SLUGS.includes(
    slug.toLowerCase() as (typeof PROJECT_RESERVED_SLUGS)[number],
  );
}
