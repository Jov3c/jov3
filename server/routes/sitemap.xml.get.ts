import { setResponseHeader } from 'h3';

import { getPublicSiteUrl } from '../utils/request-site-url';
import { useSitePublicationService } from '../utils/site-publication';

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  setResponseHeader(event, 'Cache-Control', 'public, max-age=300');
  return useSitePublicationService().sitemap(getPublicSiteUrl(event));
});
