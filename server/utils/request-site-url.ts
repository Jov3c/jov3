import { getRequestURL, type H3Event } from 'h3';

import { resolvePublicSiteUrl } from './site-url';

export function getPublicSiteUrl(event: H3Event) {
  const config = useRuntimeConfig(event) as { public?: { siteUrl?: string } };
  return resolvePublicSiteUrl(config.public?.siteUrl, getRequestURL(event).origin);
}
