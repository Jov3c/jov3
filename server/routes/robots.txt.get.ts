import { setResponseHeader } from 'h3';

import { getPublicSiteUrl } from '../utils/request-site-url';

export default defineEventHandler((event) => {
  const siteUrl = getPublicSiteUrl(event);
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /uploads/',
    'Disallow: /verify/',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
});
