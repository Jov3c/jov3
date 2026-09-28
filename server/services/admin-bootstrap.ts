import { z } from 'zod';

import { hashPassword } from '../utils/security';

const bootstrapSchema = z.object({
  ADMIN_EMAIL: z.email().max(254),
  ADMIN_PASSWORD: z.string().min(12).max(128),
  ADMIN_DISPLAY_NAME: z.string().trim().min(1).max(80),
});

export interface BootstrapConfig {
  email: string;
  password: string;
  displayName: string;
}

interface BootstrapClient {
  adminUser: {
    findFirst(): Promise<{ email: string } | null>;
    create(args: {
      data: { email: string; passwordHash: string; displayName: string };
    }): Promise<unknown>;
  };
  siteProfile: {
    findFirst(): Promise<{ id: string } | null>;
    create(args: {
      data: { siteTitle: string; siteDescription: string; foundedAt: Date };
    }): Promise<unknown>;
  };
}

export function parseBootstrapConfig(
  environment: Record<string, string | undefined>,
): BootstrapConfig {
  const parsed = bootstrapSchema.safeParse(environment);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Invalid admin bootstrap configuration: ${issue?.path.join('.')}: ${issue?.message}`,
    );
  }

  return {
    email: parsed.data.ADMIN_EMAIL.toLowerCase(),
    password: parsed.data.ADMIN_PASSWORD,
    displayName: parsed.data.ADMIN_DISPLAY_NAME,
  };
}

export async function bootstrapAdmin(client: BootstrapClient, config: BootstrapConfig) {
  const existingAdmin = await client.adminUser.findFirst();
  if (existingAdmin && existingAdmin.email !== config.email) {
    throw new Error('An administrator already exists with a different email');
  }

  if (!existingAdmin) {
    const passwordHash = await hashPassword(config.password);
    await client.adminUser.create({
      data: { email: config.email, passwordHash, displayName: config.displayName },
    });
  }

  const siteProfile = await client.siteProfile.findFirst();
  if (!siteProfile) {
    await client.siteProfile.create({
      data: {
        siteTitle: 'JOV3',
        siteDescription: 'Building products, tools and ideas on the internet.',
        foundedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
  }

  return { created: !existingAdmin, email: config.email };
}
