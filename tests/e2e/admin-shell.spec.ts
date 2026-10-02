import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

async function signIn(page: import('@playwright/test').Page, forwardedFor: string) {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': forwardedFor });
  await page.goto('/admin/login');
  await page.getByLabel('邮箱').fill(adminEmail);
  await page.getByLabel('密码').fill(adminPassword);
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/admin' && url.search === '', {
      waitUntil: 'domcontentloaded',
    }),
    page.getByRole('button', { name: '登录', exact: true }).click(),
  ]);
}

test('admin login protects the shell and logout invalidates access', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Admin auth flow runs once');
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': '10.0.0.21' });

  await page.goto('/admin');
  await expect(page).toHaveURL(
    (url) => url.pathname === '/admin/login' && url.searchParams.get('redirect') === '/admin',
  );
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');

  await page.getByLabel('邮箱').fill(adminEmail);
  await page.getByLabel('密码').fill(adminPassword);
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/admin' && url.search === '', {
      waitUntil: 'domcontentloaded',
    }),
    page.getByRole('button', { name: '登录', exact: true }).click(),
  ]);
  await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await expect(page.getByText(adminEmail, { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('admin_token'))).toBeNull();

  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/admin');
  await expect(page).toHaveURL(
    (url) => url.pathname === '/admin/login' && url.searchParams.get('redirect') === '/admin',
  );
});

test('mobile navigation exposes every admin destination and manages focus', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Responsive admin shell runs once');
  await signIn(page, '10.0.0.22');

  const menuButton = page.getByRole('button', { name: '打开导航' });
  const closeButton = page.getByRole('button', { name: '关闭导航' }).last();
  const destinations = [
    '仪表盘',
    '文章管理',
    '分类管理',
    '项目管理',
    '时间线',
    '首页资料',
    '个人简历',
    '评论管理',
    '留言管理',
    '友链管理',
    '媒体库',
  ];

  for (const width of [390, 800, 900]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(closeButton).toBeFocused();
    for (const name of destinations) {
      await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toBeFocused();
  }
});
