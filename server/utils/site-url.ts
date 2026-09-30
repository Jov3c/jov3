export function normalizeSiteUrl(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const path = url.pathname.replace(/\/+$/, '');
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

export function resolvePublicSiteUrl(configured: string | undefined, requestOrigin: string) {
  return normalizeSiteUrl(configured) ?? normalizeSiteUrl(requestOrigin) ?? 'http://localhost:3000';
}
