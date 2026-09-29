import { expect, test } from '@playwright/test';

const adminEmail = process.env.ADMIN_EMAIL ?? 'stage02-admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'stage-02-e2e-admin-password';

test('auth API uses a secure cookie and invalidates the database session on logout', async ({
  request,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'API contract runs once per browser engine',
  );
  const invalid = await request.post('/api/v1/auth/login', {
    data: { email: adminEmail, password: 'incorrect-password' },
  });
  expect(invalid.status()).toBe(401);
  await expect(invalid.json()).resolves.toMatchObject({ error: { code: 'INVALID_CREDENTIALS' } });

  const login = await request.post('/api/v1/auth/login', {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.status()).toBe(200);
  const cookie = login.headers()['set-cookie'] ?? '';
  expect(cookie).toContain('jov3_admin_session=');
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('Secure');
  expect(cookie).toContain('SameSite=Lax');
  expect(await login.text()).not.toContain('jov3_admin_session');

  const me = await request.get('/api/v1/auth/me');
  expect(me.status()).toBe(200);
  await expect(me.json()).resolves.toMatchObject({ data: { admin: { email: adminEmail } } });

  const protectedRoute = await request.get('/api/v1/admin/session');
  expect(protectedRoute.status()).toBe(200);

  const forbidden = await request.post('/api/v1/auth/logout', {
    headers: { Origin: 'https://attacker.example' },
  });
  expect(forbidden.status()).toBe(403);

  const logout = await request.post('/api/v1/auth/logout');
  expect(logout.status()).toBe(200);
  const afterLogout = await request.get('/api/v1/auth/me');
  expect(afterLogout.status()).toBe(401);
});

test('protected admin APIs reject anonymous requests', async ({ playwright }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'API contract runs once per browser engine',
  );
  const anonymous = await playwright.request.newContext({
    baseURL: 'https://127.0.0.1:3000',
    ignoreHTTPSErrors: true,
  });
  const response = await anonymous.get('/api/v1/admin/session');
  expect(response.status()).toBe(401);
  await anonymous.dispose();
});
