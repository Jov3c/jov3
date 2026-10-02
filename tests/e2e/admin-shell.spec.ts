import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

test('admin login protects the shell and logout invalidates access', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Admin auth flow runs once');
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': '10.0.0.21' });

  await page.goto('/admin');
  await expect(page).toHaveURL(
    (url) => url.pathname === '/admin/login' && url.searchParams.get('redirect') === '/admin',
  );
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');

  await page.getByLabel('邮箱').fill(adminEmail);
  await page.getByLabel('密码').fill(adminPassword);
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/admin' && url.search === '', {
      waitUntil: 'domcontentloaded',
    }),
    page.getByRole('button', { name: '登录', exact: true }).click(),
  ]);
  await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await expect(page.getByText(adminEmail, { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('admin_token'))).toBeNull();

  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/admin');
  await expect(page).toHaveURL(
    (url) => url.pathname === '/admin/login' && url.searchParams.get('redirect') === '/admin',
  );
});
