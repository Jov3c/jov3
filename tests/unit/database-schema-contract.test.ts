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
  });

  it('stores email verification tokens as hashes with expiry state', () => {
    expect(schema).toContain('model EmailVerification {');
    expect(schema).toContain('tokenHash');
    expect(schema).toContain('consumedAt');
    expect(schema).toContain('expiresAt');
    expect(schema).not.toMatch(/model EmailVerification \{[\s\S]*\btoken\s+String/);
  });
});
