import { expect, test } from '@playwright/test';

test('public article and guestbook hide private email fields', async ({ page }) => {
  await page.goto('/blog/server');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: '评论', exact: true })).toBeVisible();
  await expect(page.getByText('把检查拆开之后确实更容易长期维护')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('@example.com');

  await page.goto('/blog/message');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Message', exact: true })).toBeVisible();
  await expect(page.getByText('这个站的整体节奏很舒服')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('@example.com');
});

test('admin can open moderation queues and see seeded content', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Admin moderation flow runs once');

  const login = await page.request.post('/api/v1/auth/login', {
    headers: { 'x-forwarded-for': '10.0.0.8' },
    data: {
      email: process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com',
      password: process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password',
    },
  });
  expect(login.ok()).toBe(true);

  await page.goto('/admin/comments');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Comments', exact: true })).toBeVisible();
  await expect(page.getByText('mori@example.com')).toBeVisible();

  await page.goto('/admin/messages');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();
  await expect(page.getByText('mori@example.com')).toBeVisible();
});
