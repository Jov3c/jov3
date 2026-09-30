import { expect, test } from '@playwright/test';

test('public CV and Timeline pages render the persisted About content', async ({ page }) => {
  const cvResponse = await page.request.get('/api/v1/public/cv');
  expect(cvResponse.ok()).toBe(true);
  const cvPayload = (await cvResponse.json()).data as {
    profile: { name: string };
    experiences: Array<{ company: string }>;
  };
  expect(cvPayload.profile.name).toBe('朱鹏 / Jov3');
  expect(cvPayload.experiences.some((item) => item.company === '天立泰科技股份有限公司')).toBe(
    true,
  );
  expect(cvPayload.profile).not.toHaveProperty('isPublic');

  await page.goto('/about/cv');
  await expect(page.getByRole('heading', { name: 'CV, but make it mine.' })).toBeVisible();
  await expect(page.getByText('朱鹏 / Jov3')).toBeVisible();
  await expect(page.getByText('天立泰科技股份有限公司')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit CV' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print / PDF' })).toBeVisible();

  const timelineResponse = await page.request.get('/api/v1/public/timeline');
  expect(timelineResponse.ok()).toBe(true);
  const timeline = (await timelineResponse.json()).data as Array<{
    title: string;
    dateLabel: string;
  }>;
  expect(timeline.length).toBeGreaterThanOrEqual(4);

  await page.goto('/about/timeline');
  await expect(page.getByRole('heading', { name: 'A story still being written.' })).toBeVisible();
  await expect(page.getByText(timeline[0]!.title)).toBeVisible();
  await expect(
    page.locator('.life-chapter__year strong', { hasText: timeline[0]!.dateLabel.slice(0, 4) }),
  ).toBeVisible();
});
