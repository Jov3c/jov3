import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

test('admin can create a README project and publish or hide it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Project admin flow runs once');

  const login = await page.request.post('/api/v1/auth/login', {
    data: { email: adminEmail, password: adminPassword },
    headers: { 'x-forwarded-for': '10.0.0.5' },
  });
  expect(login.ok()).toBe(true);

  const suffix = Date.now().toString();
  const slug = `stage-five-e2e-${suffix}`;
  let createdId = '';

  try {
    await page.goto('/admin/projects');
    await expect(page.getByRole('heading', { name: '项目管理' })).toBeVisible();
    await page.getByRole('button', { name: '新建项目' }).click();

    await page.getByLabel('名称').fill('Stage Five E2E');
    await page.getByLabel('路径标识').fill(slug);
    await page.getByLabel('摘要').fill('A project created through the protected editor.');
    await page.getByLabel('技术栈（使用英文逗号分隔）').fill('Vue, Markdown, Vitest');
    await page.getByLabel('GitHub 地址').fill('https://github.com/Jov3c/stage-five-e2e');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'README.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Stage Five README\n\n- Imported from a Markdown file\n'),
    });
    await expect(page.getByLabel('README Markdown 源码')).toHaveValue(/Stage Five README/);
    await expect(page.getByText('Imported from a Markdown file').last()).toBeVisible();

    await page.getByRole('button', { name: '创建项目' }).click();
    await expect(page.getByRole('status')).toContainText('已创建');

    const listResponse = await page.request.get('/api/v1/admin/projects');
    expect(listResponse.ok()).toBe(true);
    const items = (await listResponse.json()).data.items as Array<{ id: string; slug: string }>;
    createdId = items.find((item) => item.slug === slug)?.id ?? '';
    expect(createdId).not.toBe('');

    const publicDetail = await page.request.get(`/api/v1/public/projects/${slug}`);
    expect(publicDetail.ok()).toBe(true);
    expect((await publicDetail.json()).data.readmeHtml).toContain('Stage Five README');

    await page.goto('/projects');
    await expect(page.getByRole('link', { name: /Stage Five E2E/ })).toBeVisible();
    await expect(page.locator(`[href="/projects/${slug}"]`)).toBeVisible();

    const hidden = await page.request.patch(`/api/v1/admin/projects/${createdId}`, {
      data: { visible: false },
    });
    expect(hidden.ok()).toBe(true);
    await page.reload();
    await expect(page.getByRole('link', { name: /Stage Five E2E/ })).toHaveCount(0);
  } finally {
    if (createdId) await page.request.delete(`/api/v1/admin/projects/${createdId}`);
  }
});
