import { expect, test } from '@playwright/test';

test('footprint renders visited cities and opens only the selected city memories', async ({
  page,
}) => {
  await page.goto('/blog/footprint');

  await expect(page.getByRole('heading', { name: 'Footprint' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '记忆地图' })).toBeVisible();
  await expect(page.getByRole('button', { name: /成都/ })).toBeVisible();
  await expect(page.locator('.footprint-map canvas')).toBeVisible();

  await page.getByRole('button', { name: /东京/ }).click();
  await expect(page.getByRole('heading', { name: '留在这里的记忆' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '秩序里的细节' })).toBeVisible();
  await expect(page.getByText('第一次如此集中地观察公共空间')).toBeVisible();
  await expect(page.getByText('生活发生的地方')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('footprint keeps the map and exposes a boundary failure state', async ({ page }) => {
  await page.route('**/api/v1/public/footprint/cities/chengdu/boundary', (route) => route.abort());
  await page.goto('/blog/footprint');

  await expect(page.getByRole('heading', { name: '记忆地图' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('地图边界加载失败');
  await expect(page.locator('.footprint-map canvas')).toBeVisible();
});
