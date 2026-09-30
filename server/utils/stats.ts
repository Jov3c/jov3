import { createHash, randomBytes } from 'node:crypto';

export const VISITOR_COOKIE_NAME = 'jov3_visitor_id';
export const ONLINE_WINDOW_MS = 5 * 60 * 1_000;

const VISITOR_ID_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const PRIVATE_PATH_PREFIXES = ['/api/', '/admin/', '/uploads/', '/verify/'];

export function normalizeTrackedPath(value: unknown) {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!input || input.length > 500 || !input.startsWith('/') || input.startsWith('//')) return null;
  if (
    input
      .split('')
      .some(
        (character) =>
          '<>{}[]\\'.includes(character) ||
          character.charCodeAt(0) < 32 ||
          character.charCodeAt(0) === 127,
      )
  ) {
    return null;
  }

  const path = input.split(/[?#]/, 1)[0] || '/';
  if (
    PRIVATE_PATH_PREFIXES.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix))
  ) {
    return null;
  }
  return path;
}

export function createVisitorId() {
  return randomBytes(32).toString('base64url');
}

export function isValidVisitorId(value: string | undefined) {
  return value !== undefined && VISITOR_ID_PATTERN.test(value);
}

export function hashVisitorId(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function calculateUptime(foundedAt: Date, now: Date) {
  const totalMinutes = Math.max(0, Math.floor((now.getTime() - foundedAt.getTime()) / 60_000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

export function formatUptime(value: ReturnType<typeof calculateUptime>) {
  return `${value.days}天 ${value.hours}时 ${value.minutes}分`;
}
