import { expect, test } from '@playwright/test';

test('visit ping stores a first-party cookie and returns real site stats', async ({ request }) => {
  const ping = await request.post('/api/v1/public/visit/ping', {
    data: { path: '/blog' },
  });
  expect(ping.status()).toBe(200);
  expect(ping.headers()['set-cookie']).toMatch(/jov3_visitor_id=/);

  const stats = await request.get('/api/v1/public/site/stats');
  expect(stats.status()).toBe(200);
  await expect(stats.json()).resolves.toMatchObject({
    data: {
      onlineVisitors: expect.any(Number),
      totalPageViews: expect.any(Number),
      foundedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      uptime: { label: expect.stringContaining('天') },
    },
  });
});

test('RSS, Sitemap, and robots publish only public website surfaces', async ({ request }) => {
  const rss = await request.get('/rss.xml');
  expect(rss.status()).toBe(200);
  expect(rss.headers()['content-type']).toMatch(/application\/rss\+xml/);
  const rssBody = await rss.text();
  expect(rssBody).toContain('<rss version="2.0"');
  expect(rssBody).toContain('博客服务器的自动巡检和基于 Git 的备份');
  expect(rssBody).not.toContain('Draft');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toMatch(/application\/xml/);
  const sitemapBody = await sitemap.text();
  expect(sitemapBody).toContain('/blog/server');
  expect(sitemapBody).toContain('/projects/signal-daily');
  expect(sitemapBody).toContain('/about/cv');
  expect(sitemapBody).not.toContain('/admin');
  expect(sitemapBody).not.toContain('/api/');

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  await expect(robots.text()).resolves.toContain('Sitemap: ');
});

test('article and project responses expose SSR content, canonical, and social metadata', async ({
  request,
}) => {
  const article = await request.get('/blog/server');
  expect(article.status()).toBe(200);
  const articleHtml = await article.text();
  expect(articleHtml).toContain('自动化的价值不是把所有事情藏起来');
  expect(articleHtml).toMatch(/<link[^>]+rel="canonical"[^>]+\/blog\/server/);
  expect(articleHtml).toMatch(/property="og:type"[^>]+content="article"/);
  expect(articleHtml).toMatch(/property="og:title"[^>]+博客服务器的自动巡检/);

  const project = await request.get('/projects/signal-daily');
  expect(project.status()).toBe(200);
  const projectHtml = await project.text();
  expect(projectHtml).toMatch(/property="og:type"[^>]+content="website"/);
  expect(projectHtml).toMatch(/property="og:title"[^>]+Signal Daily/);
});
