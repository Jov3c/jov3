import { expect, test } from '@playwright/test';

test('blog index exposes article content and utility navigation', async ({ page }) => {
  await page.goto('/blog');

  await expect(page.getByRole('heading', { name: 'Writing, slowly.' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: '博客导航' }).getByRole('link')).toHaveCount(4);
  await page.getByRole('link', { name: /博客服务器的自动巡检/ }).click();
  await expect(page).toHaveURL(/\/blog\/server$/);
  await expect(page.getByText('1963 words')).toBeVisible();
});

test('blog utilities preserve archive, links, and guestbook semantics', async ({ page }) => {
  await page.goto('/blog/archive');
  await expect(page.getByRole('heading', { name: 'All posts, over time.' })).toBeVisible();

  await page.goto('/blog/links');
  await expect(page.getByRole('link', { name: /FeiTwnd/ })).toHaveAttribute(
    'href',
    'https://feitwnd.cc',
  );
  await expect(page.getByText('Mori', { exact: true })).toBeVisible();

  await page.goto('/blog/message');
  await expect(page.getByRole('heading', { name: 'Leave a small note.' })).toBeVisible();
  await expect(page.getByText('这个站的整体节奏很舒服')).toBeVisible();
  await expect(page.getByText(/当前阶段仅展示表单/)).toBeVisible();
});
