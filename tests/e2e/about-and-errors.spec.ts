import { expect, test } from '@playwright/test';

test('about redirects to the timeline and exposes both stories', async ({ page }) => {
  await page.goto('/about');
  await expect(page).toHaveURL(/\/about\/timeline$/);
  await expect(page.getByRole('heading', { name: '人生时间线' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '第一次完整做完一个自己的项目' })).toBeVisible();

  await page.goto('/about/cv');
  await expect(page.getByRole('heading', { name: '个人简历' })).toBeVisible();
  await expect(page.getByText('天立泰科技股份有限公司')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit CV' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reset' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '打印 / 导出 PDF' })).toBeVisible();
});

test('unknown content returns a useful 404 page', async ({ page }) => {
  const response = await page.goto('/projects/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This page wandered off.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/');
});
