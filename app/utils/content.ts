import { blogPosts, projects } from '../data/content';

export function findProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function findPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function isSafeExternalUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function formatPostDate(value: string) {
  return value.replace(/-/g, '.').slice(0, 10);
}
