import { expect, test } from '@playwright/test';

test('public Links follows the prototype loading and responsive layout', async ({
  page,
  request,
}) => {
  const response = await request.get('/api/v1/public/links?page=1&pageSize=6');
  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.data.some((link: { name: string }) => link.name === 'FeiTwnd')).toBe(true);
  expect(JSON.stringify(payload)).not.toContain('@example.com');

  await page.goto('/blog/links');
  await expect(page.getByLabel('正在加载友链')).toBeVisible();
  await expect(page.getByText('Loading…', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Links', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '想交换友链？' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /FeiTwnd/ })).toHaveAttribute(
    'href',
    'https://feitwnd.cc',
  );

  const cards = page.locator('.link-card:not(.link-card--skeleton)');
  await expect(cards).toHaveCount(6);
  await expect(page.locator('.links-card')).toBeVisible();
  const columns = await page
    .locator('.link-grid')
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(page.viewportSize()!.width <= 660 ? 1 : 2);
});

test('Blog and Links are immediately visible with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blog');
  await expect(page.locator('.post-card').first()).toHaveCSS('opacity', '1');

  await page.goto('/blog/links');
  await expect(page.locator('.link-card:not(.link-card--skeleton)').first()).toHaveCSS(
    'opacity',
    '1',
  );
});
