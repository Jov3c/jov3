export const PROJECT_NAME = 'JOV3' as const;

export const PROJECT_STATUSES = ['BUILDING', 'ACTIVE', 'DONE', 'PAUSED'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  BUILDING: '构建中',
  ACTIVE: '持续维护',
  DONE: '已完成',
  PAUSED: '已暂停',
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
