import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/projects',
  '/projects/signal-daily',
  '/blog',
  '/blog/server',
  '/blog/archive',
  '/blog/links',
  '/blog/message',
  '/about/cv',
  '/about/timeline',
];

test('all Stage 01 public routes render without placeholder links or overflow', async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  for (const route of publicRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('#main-content')).toBeVisible();
    expect(await page.locator('a[href="#"]').count(), `${route} contains href="#"`).toBe(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `${route} has horizontal overflow`,
    ).toBe(true);
  }

  expect(runtimeErrors).toEqual([]);
});
