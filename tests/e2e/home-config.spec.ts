import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

test('admin can add a homepage entry and the public page reads it from the API', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Homepage configuration flow runs once');

  const login = await page.request.post('/api/v1/auth/login', {
    headers: { 'x-forwarded-for': '10.0.0.23' },
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.ok()).toBe(true);

  let createdId = '';
  try {
    await page.goto('/admin/home');
    await expect(page.getByRole('heading', { name: '首页资料' })).toBeVisible();
    const entryForm = page.locator('form.home-new-entry').first();
    await entryForm.getByLabel('标题').fill('Stage 04 Custom');
    await entryForm.getByLabel('描述').fill('A configurable homepage destination.');
    await entryForm.getByLabel('地址').fill('/projects');
    await entryForm.getByRole('button', { name: '添加入口' }).click();
    await expect(page.getByRole('status')).toContainText('首页入口已新增');

    const entriesResponse = await page.request.get('/api/v1/admin/home-entries');
    const entries = (await entriesResponse.json()).data as Array<{ id: string; title: string }>;
    createdId = entries.find((entry) => entry.title === 'Stage 04 Custom')?.id ?? '';
    expect(createdId).not.toBe('');

    await page.goto('/');
    await expect(page.getByRole('link', { name: /Stage 04 Custom/ })).toBeVisible();

    const hidden = await page.request.patch(`/api/v1/admin/home-entries/${createdId}`, {
      data: { visible: false },
    });
    expect(hidden.ok()).toBe(true);
    await page.reload();
    await expect(page.getByRole('link', { name: /Stage 04 Custom/ })).toHaveCount(0);
  } finally {
    if (createdId) await page.request.delete(`/api/v1/admin/home-entries/${createdId}`);
  }
});
