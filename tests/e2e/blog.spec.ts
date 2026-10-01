import { expect, test } from '@playwright/test';

test('blog index exposes database-backed articles and category filtering', async ({ page }) => {
  await page.goto('/blog');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: '博客导航' }).getByRole('link')).toHaveCount(3);
  await page.getByRole('button', { name: '全部分类' }).click();
  await expect(page.locator('.category-option').filter({ hasText: 'AI' })).toBeVisible();
  await page.locator('.category-option').filter({ hasText: 'AI' }).click();
  await expect(page).toHaveURL(/category=ai/);
  await expect(page.getByRole('heading', { name: /本地部署大模型/ })).toBeVisible();
  await page.goto('/blog');
  await page.getByRole('link', { name: /博客服务器的自动巡检/ }).click();
  await expect(page).toHaveURL(/\/blog\/server$/);
  await expect(page.getByText(/words$/)).toBeVisible();
  await expect(page.locator('.article-header').getByRole('heading')).toContainText(
    '博客服务器的自动巡检',
  );
});

test('blog utilities preserve archive, links, and guestbook semantics', async ({ page }) => {
  await page.goto('/blog/archive');
  await expect(page.getByRole('heading', { name: 'Archive', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /博客服务器的自动巡检/ }).click();
  await expect(page).toHaveURL(/\/blog\/server$/);

  await page.goto('/blog/links');
  await expect(page.getByRole('link', { name: /FeiTwnd/ })).toHaveAttribute(
    'href',
    'https://feitwnd.cc',
  );
  await expect(page.getByText('Mori', { exact: true })).toBeVisible();

  await page.goto('/blog/message');
  await expect(page.getByRole('heading', { name: 'Message', exact: true })).toBeVisible();
  await expect(page.getByText('这个站的整体节奏很舒服')).toBeVisible();
  await expect(page.getByText(/验证邮箱后公开/)).toBeVisible();
});
