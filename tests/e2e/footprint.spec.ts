import { expect, test } from '@playwright/test';

test('footprint lets visitors explore typed place memories', async ({ page }) => {
  await page.goto('/blog/footprint');

  await expect(page.getByRole('heading', { name: 'Places I remember.' })).toBeVisible();
  await expect(page.getByRole('button', { name: '查看成都足迹' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const tokyoMarker = page.getByRole('button', { name: '查看东京足迹' });
  await expect(tokyoMarker).toBeEnabled();
  await page.locator('html[data-hydrated="true"]').waitFor();
  await tokyoMarker.click();
  await expect(tokyoMarker).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: '秩序里的细节' })).toBeVisible();
  await expect(page.getByText('第一次如此集中地观察公共空间')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
