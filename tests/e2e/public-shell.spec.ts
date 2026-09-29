import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}

test('home presents the personal entry points', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Jov3/);
  await expect(page.getByRole('heading', { name: 'Jov3', exact: true })).toBeVisible();
  const entries = page.getByRole('navigation', { name: '站点入口' });
  await expect(entries.getByRole('link', { name: /Projects/ })).toHaveAttribute(
    'href',
    '/projects',
  );
  await expect(entries.getByRole('link', { name: /Notes/ })).toHaveAttribute(
    'href',
    '/blog/archive',
  );
  await expectNoHorizontalOverflow(page);
});

test('projects open a README-style detail page', async ({ page }) => {
  await page.goto('/projects');

  await expect(page.getByRole('heading', { name: 'Selected work.' })).toBeVisible();
  await page.getByRole('link', { name: /Signal Daily/ }).click();
  await expect(page).toHaveURL(/\/projects\/signal-daily$/);
  await expect(
    page.locator('.project-detail__hero').getByRole('heading', { name: 'Signal Daily' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();
  await expect(page.locator('.project-actions [aria-disabled="true"]')).toHaveAttribute(
    'title',
    '暂无在线预览',
  );
  await expectNoHorizontalOverflow(page);
});
