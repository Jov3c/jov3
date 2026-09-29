import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

test('admin can create, publish, and remove a database-backed post', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Admin blog flow runs once');

  const login = await page.request.post('/api/v1/auth/login', {
    headers: { 'x-forwarded-for': '10.0.0.6' },
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.ok()).toBe(true);

  const suffix = Date.now();
  let createdId = '';
  try {
    await page.goto('/admin/posts');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Posts', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'New post' }).click();
    await page
      .getByRole('textbox', { name: 'Title', exact: true })
      .fill(`Stage Six Post ${suffix}`);
    await page.getByRole('textbox', { name: 'Slug', exact: true }).fill(`stage-six-e2e-${suffix}`);
    await page
      .getByRole('textbox', { name: 'Excerpt', exact: true })
      .fill('A post created by the Stage 06 browser flow.');
    await page
      .getByLabel('Markdown source')
      .fill(`# Stage Six E2E\n\nCreated from the admin editor.`);
    await page.getByRole('button', { name: 'Create post' }).click();
    await expect(page.getByRole('status')).toContainText('已创建');

    const postsResponse = await page.request.get('/api/v1/admin/posts');
    const posts = (await postsResponse.json()).data as Array<{ id: string; slug: string }>;
    createdId = posts.find((post) => post.slug === `stage-six-e2e-${suffix}`)?.id ?? '';
    expect(createdId).not.toBe('');

    await expect(page.getByRole('button', { name: 'Publish now' })).toBeVisible();
    await page.getByRole('button', { name: 'Publish now' }).click();
    await expect(page.getByRole('status')).toContainText('已发布');
    const publicResponse = await page.request.get(`/api/v1/public/posts/stage-six-e2e-${suffix}`);
    expect(publicResponse.ok()).toBe(true);
  } finally {
    if (createdId) await page.request.delete(`/api/v1/admin/posts/${createdId}`);
  }
});

test('admin categories page shows post usage before deletion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Category editor flow runs once');

  const login = await page.request.post('/api/v1/auth/login', {
    headers: { 'x-forwarded-for': '10.0.0.7' },
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.ok()).toBe(true);

  await page.goto('/admin/categories');
  await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible();
  await expect(page.getByText(/posts$/).first()).toBeVisible();
});
