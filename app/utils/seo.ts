export interface PageSeoInput {
  title: string;
  description: string;
  path?: string;
  type?: 'website' | 'article';
  image?: string | null;
  publishedAt?: string | null;
}

export interface PageSeoMeta {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogType: 'website' | 'article';
  ogUrl: string;
  ogImage?: string;
  articlePublishedTime?: string;
  twitterCard: 'summary' | 'summary_large_image';
}

export function buildPageSeoMeta(
  input: PageSeoInput,
  siteUrl: string,
  currentPath = input.path ?? '/',
): PageSeoMeta {
  const baseUrl = normalizeSiteUrl(siteUrl) ?? 'http://localhost:3000';
  const path = currentPath.split(/[?#]/, 1)[0] || '/';
  const canonical = `${baseUrl}${path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`}`;
  const result: PageSeoMeta = {
    title: input.title,
    description: input.description,
    canonical,
    ogTitle: input.title,
    ogDescription: input.description,
    ogType: input.type ?? 'website',
    ogUrl: canonical,
    twitterCard: input.image ? 'summary_large_image' : 'summary',
  };

  if (input.image) result.ogImage = normalizeImageUrl(input.image, baseUrl);
  if (input.publishedAt) result.articlePublishedTime = input.publishedAt;
  return result;
}

function normalizeSiteUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

function normalizeImageUrl(value: string, baseUrl: string) {
  try {
    const imageUrl = new URL(value, `${baseUrl}/`);
    return ['http:', 'https:'].includes(imageUrl.protocol) ? imageUrl.toString() : value;
  } catch {
    return value;
  }
}
