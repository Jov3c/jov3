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
