import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

test('admin login protects the shell and logout invalidates access', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Admin auth flow runs once');

  await page.goto('/admin');
  await expect(page).toHaveURL(
    (url) => url.pathname === '/admin/login' && url.searchParams.get('redirect') === '/admin',
  );
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');

  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/admin' && url.search === '', {
      waitUntil: 'domcontentloaded',
    }),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await expect(page.getByText(adminEmail, { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('admin_token'))).toBeNull();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/admin');
  await expect(page).toHaveURL(
    (url) => url.pathname === '/admin/login' && url.searchParams.get('redirect') === '/admin',
  );
});
