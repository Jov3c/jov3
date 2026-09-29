import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';
const onePixelPng = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360a0c0000002000100ff0d0a2db40000000049454e44ae426082',
  'hex',
);

test('admin can upload, edit, serve, query, and delete media', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Media API flow runs once');

  const login = await page.request.post('/api/v1/auth/login', {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.ok()).toBe(true);

  await page.goto('/admin/media');
  await expect(page.getByRole('heading', { name: 'Media Library' })).toBeVisible();

  const invalid = await page.request.post('/api/v1/admin/media/upload', {
    multipart: {
      file: { name: 'not-an-image.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg />') },
      category: 'general',
      altText: 'Rejected SVG',
    },
  });
  expect(invalid.status()).toBe(400);

  const upload = await page.request.post('/api/v1/admin/media/upload', {
    multipart: {
      file: { name: 'prototype.png', mimeType: 'image/png', buffer: onePixelPng },
      category: 'general',
      altText: 'A tiny prototype image',
    },
  });
  expect(upload.status()).toBe(200);
  const uploaded = (await upload.json()).data as {
    id: string;
    publicUrl: string;
    altText: string;
    referenceCount: number;
  };
  expect(uploaded.publicUrl).toMatch(/^\/uploads\/general\/\d{4}\/\d{2}\/[0-9a-f-]+\.png$/);
  expect(uploaded.altText).toBe('A tiny prototype image');
  expect(uploaded.referenceCount).toBe(0);

  const served = await page.request.get(uploaded.publicUrl);
  expect(served.status()).toBe(200);
  expect(served.headers()['content-type']).toContain('image/png');
  expect(await served.body()).toEqual(onePixelPng);

  const update = await page.request.patch(`/api/v1/admin/media/${uploaded.id}`, {
    data: { altText: 'Updated prototype image' },
  });
  expect(update.status()).toBe(200);
  expect((await update.json()).data.altText).toBe('Updated prototype image');

  const search = await page.request.get('/api/v1/admin/media', {
    params: { q: 'Updated prototype' },
  });
  expect(search.status()).toBe(200);
  expect((await search.json()).data).toHaveLength(1);

  const deletion = await page.request.delete(`/api/v1/admin/media/${uploaded.id}`);
  expect(deletion.status()).toBe(200);
  expect((await page.request.get(uploaded.publicUrl)).status()).toBe(404);
});
