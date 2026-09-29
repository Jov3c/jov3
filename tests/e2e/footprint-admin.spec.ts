import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

test('admin can create, hide, and remove a city memory', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Footprint admin flow runs once');

  const login = await page.request.post('/api/v1/auth/login', {
    data: { email: adminEmail, password: adminPassword },
    headers: { 'x-forwarded-for': '10.0.0.11' },
  });
  expect(login.ok()).toBe(true);

  const suffix = Date.now().toString();
  const slug = `stage-ten-${suffix}`;
  let cityId = '';
  let memoryId = '';
  page.on('dialog', (dialog) => void dialog.accept());

  try {
    await page.goto('/admin/footprint');
    await expect(page.getByRole('heading', { name: 'Footprint', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'New city' }).click();
    await page.getByLabel('City name').fill('Stage Ten City');
    await page.getByLabel('Slug').fill(slug);
    await page.getByRole('button', { name: 'Create city' }).click();
    await expect(page.getByRole('status')).toContainText('已创建');

    const cities = (await (await page.request.get('/api/v1/admin/footprint/cities')).json())
      .data as Array<{
      id: string;
      slug: string;
    }>;
    cityId = cities.find((city) => city.slug === slug)?.id ?? '';
    expect(cityId).not.toBe('');

    await page.getByRole('button', { name: 'New memory' }).click();
    await page.getByLabel('Title').fill('Stage Ten Memory');
    await page.getByLabel('Body').fill('A memory created from the Footprint editor.');
    await page.getByRole('button', { name: 'Create memory' }).click();
    await expect(page.getByRole('status')).toContainText('已创建');

    const publicCities = (await (await page.request.get('/api/v1/public/footprint/cities')).json())
      .data as Array<{
      id: string;
      slug: string;
      visited: boolean;
      memoryCount: number;
    }>;
    const visitedCity = publicCities.find((city) => city.slug === slug);
    expect(visitedCity).toMatchObject({ visited: true, memoryCount: 1 });

    const memories = (await (await page.request.get('/api/v1/admin/footprint/memories')).json())
      .data as Array<{
      id: string;
      title: string;
    }>;
    memoryId = memories.find((memory) => memory.title === 'Stage Ten Memory')?.id ?? '';
    expect(memoryId).not.toBe('');

    await page.getByLabel('Visible on public Footprint').uncheck();
    await page.getByRole('button', { name: 'Save memory' }).click();
    await expect(page.getByRole('status')).toContainText('已保存');

    const hiddenCities = (await (await page.request.get('/api/v1/public/footprint/cities')).json())
      .data as Array<{
      slug: string;
      visited: boolean;
      memoryCount: number;
    }>;
    expect(hiddenCities.find((city) => city.slug === slug)).toMatchObject({
      visited: false,
      memoryCount: 0,
    });
  } finally {
    if (memoryId) await page.request.delete(`/api/v1/admin/footprint/memories/${memoryId}`);
    if (cityId) await page.request.delete(`/api/v1/admin/footprint/cities/${cityId}`);
  }
});
