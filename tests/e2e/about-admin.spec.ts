import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

test('admin can toggle CV visibility without deleting its content', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'About admin flow runs once');

  const login = await page.request.post('/api/v1/auth/login', {
    data: { email: adminEmail, password: adminPassword },
    headers: { 'x-forwarded-for': '10.0.0.9' },
  });
  expect(login.ok()).toBe(true);

  const original = (await (await page.request.get('/api/v1/admin/cv/profile')).json()).data;
  try {
    await page.goto('/admin/cv');
    await expect(page.getByRole('heading', { name: '个人简历' })).toBeVisible();
    await expect(page.getByRole('link', { name: '时间线' })).toBeVisible();
    await expect(page.getByLabel('公开简历')).toBeChecked();

    await page.getByLabel('公开简历').uncheck();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/v1/admin/cv/profile') &&
          response.request().method() === 'PATCH' &&
          response.ok(),
      ),
      page.getByRole('button', { name: '保存资料' }).click(),
    ]);
    await expect(page.getByRole('status')).toContainText('已保存');
    expect((await page.request.get('/api/v1/public/cv')).status()).toBe(404);
    const privateSitemap = await page.request.get('/sitemap.xml');
    expect(await privateSitemap.text()).not.toContain('/about/cv');
    await expect(page.getByText('设为私密后，前台“关于”菜单将隐藏个人简历')).toBeVisible();

    await page.getByLabel('公开简历').check();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/v1/admin/cv/profile') &&
          response.request().method() === 'PATCH' &&
          response.ok(),
      ),
      page.getByRole('button', { name: '保存资料' }).click(),
    ]);
    await expect(page.getByRole('status')).toContainText('已保存');
    expect((await page.request.get('/api/v1/public/cv')).ok()).toBe(true);
  } finally {
    await page.request.patch('/api/v1/admin/cv/profile', {
      data: {
        isPublic: original.isPublic,
        name: original.name,
        headline: original.headline,
        bio: original.bio,
        location: original.location,
        website: original.website,
        statusText: original.statusText,
        statement: original.statement,
        portraitMediaId: original.portraitMediaId,
      },
    });
  }
});

test('admin can create and remove a Timeline entry', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'About admin flow runs once');

  const login = await page.request.post('/api/v1/auth/login', {
    data: { email: adminEmail, password: adminPassword },
    headers: { 'x-forwarded-for': '10.0.0.10' },
  });
  expect(login.ok()).toBe(true);

  const title = `Stage Nine Timeline ${Date.now()}`;
  let createdId = '';
  try {
    await page.goto('/admin/timeline');
    await expect(page.getByRole('heading', { name: '时间线管理', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '新建条目' }).click();
    await page.getByRole('textbox', { name: '日期', exact: true }).fill('2026-09-29');
    await page.getByLabel('日期精度').selectOption('DAY');
    await page.getByLabel('标题').fill(title);
    await page.getByLabel('正文').fill('Created from the Timeline editor.');
    await page.getByRole('button', { name: '创建条目' }).click();
    await expect(page.getByRole('status')).toContainText('已创建');

    const adminItems = (await (await page.request.get('/api/v1/admin/timeline')).json())
      .data as Array<{
      id: string;
      title: string;
    }>;
    createdId = adminItems.find((item) => item.title === title)?.id ?? '';
    expect(createdId).not.toBe('');

    const publicItems = (await (await page.request.get('/api/v1/public/timeline')).json())
      .data as Array<{
      id: string;
      title: string;
    }>;
    expect(publicItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: createdId, title })]),
    );
  } finally {
    if (createdId) await page.request.delete(`/api/v1/admin/timeline/${createdId}`);
  }
});
