import { expect, test } from '@playwright/test';

test('renders the bootstrap health page without horizontal overflow', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/JOV3/);
  await expect(page.getByRole('heading', { name: 'JOV3' })).toBeVisible();
  await expect(page.getByText('Bootstrap ready')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
