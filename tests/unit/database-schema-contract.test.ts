import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const schemaPath = fileURLToPath(new URL('../../prisma/schema.prisma', import.meta.url));
const schema = readFileSync(schemaPath, 'utf8');

describe('database contract', () => {
  it.each([
    'AdminUser',
    'AdminSession',
    'SiteProfile',
    'MediaAsset',
    'EmailVerification',
    'HomeProfile',
    'HomeEntry',
    'SocialLink',
    'Project',
    'PostCategory',
    'Post',
    'ArticleComment',
    'Message',
    'FriendLink',
    'CvProfile',
    'CvExperience',
    'CvEducation',
    'CvSkillGroup',
    'CvProjectRef',
    'TimelineEntry',
    'TimelineEntryMedia',
    'TimelineEntryLink',
    'TimelineEntryProject',
    'PageViewDaily',
    'VisitorActivity',
  ])('defines the %s model', (model) => {
    expect(schema).toContain(`model ${model} {`);
  });

  it('maps sensitive session state to hash-only storage', () => {
    expect(schema).toContain('tokenHash');
    expect(schema).toContain('@db.Char(64)');
    expect(schema).not.toMatch(/\btoken\s+String/);
  });

  it('uses UUID identifiers and mapped snake-case tables', () => {
    expect(schema.match(/@default\(uuid\(\)\) @db\.Uuid/g)?.length).toBeGreaterThanOrEqual(4);
    expect(schema).toContain('@@map("admin_users")');
    expect(schema).toContain('@@map("admin_sessions")');
    expect(schema).toContain('@@map("site_profile")');
    expect(schema).toContain('@@map("media_assets")');
    expect(schema).toContain('@@map("email_verifications")');
    expect(schema).toContain('@@map("home_profile")');
    expect(schema).toContain('@@map("home_entries")');
    expect(schema).toContain('@@map("social_links")');
    expect(schema).toContain('@@map("projects")');
    expect(schema).toContain('@@map("post_categories")');
    expect(schema).toContain('@@map("posts")');
    expect(schema).toContain('@@map("article_comments")');
    expect(schema).toContain('@@map("messages")');
    expect(schema).toContain('@@map("friend_links")');
    expect(schema).toContain('enum FriendLinkStatus');
    expect(schema).toContain('enum FriendLinkSource');
    expect(schema).toContain('enum DatePrecision');
    expect(schema).toContain('@@map("cv_profile")');
    expect(schema).toContain('@@map("cv_experiences")');
    expect(schema).toContain('@@map("cv_educations")');
    expect(schema).toContain('@@map("cv_skill_groups")');
    expect(schema).toContain('@@map("cv_project_refs")');
    expect(schema).toContain('@@map("timeline_entries")');
    expect(schema).toContain('@@map("timeline_entry_media")');
    expect(schema).toContain('@@map("timeline_entry_links")');
    expect(schema).toContain('@@map("timeline_entry_projects")');
    expect(schema).toContain('projectId');
    expect(schema).toContain('@@map("page_view_daily")');
    expect(schema).toContain('@@map("visitor_activity")');
  });

  it('stores email verification tokens as hashes with expiry state', () => {
    expect(schema).toContain('model EmailVerification {');
    expect(schema).toContain('tokenHash');
    expect(schema).toContain('consumedAt');
    expect(schema).toContain('expiresAt');
    expect(schema).not.toMatch(/model EmailVerification \{[\s\S]*\btoken\s+String/);
  });
});
