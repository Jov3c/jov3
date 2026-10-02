import type { PrismaClient } from '../../server/generated/prisma/client';

export const BROWSER_RESET_TABLES = [
  'admin_sessions',
  'admin_users',
  'site_profile',
  'media_assets',
  'email_verifications',
  'home_profile',
  'home_entries',
  'social_links',
  'projects',
  'post_categories',
  'posts',
  'article_comments',
  'messages',
  'friend_links',
  'cv_profile',
  'cv_experiences',
  'cv_educations',
  'cv_skill_groups',
  'cv_project_refs',
  'timeline_entries',
  'timeline_entry_media',
  'timeline_entry_links',
  'timeline_entry_projects',
  'page_view_daily',
  'visitor_activity',
] as const;

type ResetEnvironment = Pick<NodeJS.ProcessEnv, 'CI' | 'JOV3_BROWSER_RESET'>;

export function assertBrowserResetAllowed(databaseUrl: string, environment: ResetEnvironment) {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('DATABASE_URL must point to PostgreSQL');
  }
  if (!parsed.pathname.slice(1)) {
    throw new Error('DATABASE_URL must include a database name');
  }
  if (environment.CI !== 'true' && environment.JOV3_BROWSER_RESET !== '1') {
    throw new Error('Set JOV3_BROWSER_RESET=1 before clearing browser test data');
  }
}

export function buildBrowserResetSql() {
  const tables = BROWSER_RESET_TABLES.map((table) => `"${table}"`).join(', ');
  return `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`;
}

export async function resetBrowserDatabase(prisma: PrismaClient) {
  // The table list is a static allowlist above; no user input is interpolated.
  await prisma.$executeRawUnsafe(buildBrowserResetSql());
}
