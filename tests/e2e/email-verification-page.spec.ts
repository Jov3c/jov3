import { expect, test } from '@playwright/test';

test('verification result page does not expose a full email address', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Verification page flow runs once');

  await page.goto('/verify/email');
  await expect(page.getByRole('heading', { name: 'Verification link missing.' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('@example.com');
});
