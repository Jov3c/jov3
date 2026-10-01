import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

test('public Links reads published friend links without exposing applicant contact data', async ({
  page,
  request,
}) => {
  const response = await request.get('/api/v1/public/links');
  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.data.some((link: { name: string }) => link.name === 'FeiTwnd')).toBe(true);
  expect(JSON.stringify(payload)).not.toContain('@example.com');

  await page.goto('/blog/links');
  await expect(page.getByRole('heading', { name: 'Links', exact: true })).toBeVisible();
  await expect(page.getByText('朋友们的小站')).toBeVisible();
  await expect(page.getByRole('heading', { name: '想交换友链？' })).toBeVisible();
  await expect(page.getByRole('link', { name: /FeiTwnd/ })).toHaveAttribute(
    'href',
    'https://feitwnd.cc',
  );
});

test('admin can review friend links and add a published link directly', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Admin friend link flow runs once');

  const login = await page.request.post('/api/v1/auth/login', {
    headers: { 'x-forwarded-for': '10.0.0.18' },
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.ok()).toBe(true);

  await page.goto('/admin/links');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Friend Links', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Published/ })).toBeVisible();
  await expect(page.getByText('FeiTwnd', { exact: true })).toBeVisible();
});

test('friend link applications use an independent three-per-hour IP limit', async ({
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Rate limit contract runs once');

  const ip = `10.8.0.${Math.floor(Math.random() * 200) + 20}`;
  const payload = {
    websiteName: 'Rate limit test',
    websiteUrl: 'https://rate-limit.example',
    description: 'A request used to verify the application limiter.',
    contactEmail: 'rate-limit@example.com',
  };
  const statuses: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const response = await request.post('/api/v1/public/links/apply', {
      headers: { 'x-forwarded-for': ip },
      data: payload,
    });
    statuses.push(response.status());
  }

  expect(statuses.slice(0, 3)).toEqual([503, 503, 503]);
  expect(statuses[3]).toBe(429);
});
