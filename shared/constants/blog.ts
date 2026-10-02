export const POST_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
};

export const BLOG_RESERVED_SLUGS = [
  'new',
  'admin',
  'api',
  'archive',
  'links',
  'message',
  'about',
  'blog',
  'projects',
  'verify',
] as const;

export function isReservedBlogSlug(slug: string) {
  return BLOG_RESERVED_SLUGS.includes(slug.toLowerCase() as (typeof BLOG_RESERVED_SLUGS)[number]);
}
