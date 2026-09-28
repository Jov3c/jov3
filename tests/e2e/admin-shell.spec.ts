import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

test('admin login protects the shell and logout invalidates access', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Admin auth flow runs once');

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login\?redirect=%2Fadmin$/);
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();

  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText(adminEmail)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('admin_token'))).toBeNull();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login\?redirect=%2Fadmin$/);
});
