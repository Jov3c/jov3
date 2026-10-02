import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { POST_STATUS_LABELS } from '../../shared/constants/blog';

const root = resolve(import.meta.dirname, '../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const pageTitles = new Map([
  ['index.vue', '仪表盘'],
  ['posts.vue', '文章管理'],
  ['categories.vue', '分类管理'],
  ['projects.vue', '项目管理'],
  ['timeline.vue', '时间线管理'],
  ['home.vue', '首页资料'],
  ['cv.vue', '个人简历'],
  ['comments.vue', '评论管理'],
  ['messages.vue', '留言管理'],
  ['links.vue', '友链管理'],
  ['media.vue', '媒体库'],
]);

describe('admin localization contract', () => {
  it.each([...pageTitles])('uses the Chinese page title in %s', (file, title) => {
    expect(read(`app/pages/admin/${file}`)).toContain(`<h1>${title}</h1>`);
  });

  it('keeps the current Chinese admin shell instead of the retired prototype shell', () => {
    const layout = read('app/layouts/admin.vue');
    const posts = read('app/pages/admin/posts.vue');

    expect(layout).toContain('管理台');
    expect(layout).toContain('查看站点');
    expect(posts).toContain('<h1>文章管理</h1>');
    expect(posts).not.toContain('<h1>Posts</h1>');
    expect(posts).not.toContain('Manage categories');
    expect(posts).not.toContain('New post');
  });

  it('presents article workflow statuses in Chinese', () => {
    expect(POST_STATUS_LABELS).toEqual({
      DRAFT: '草稿',
      PUBLISHED: '已发布',
    });
  });

  it('keeps operational interface copy in Chinese', () => {
    const login = read('app/pages/admin/login.vue');
    const media = read('app/pages/admin/media.vue');

    expect(login).not.toContain('fetchError.data?.error?.message');
    expect(media).toContain('独立持久化存储');
    expect(media).not.toContain('stored outside the build');
    expect(media).not.toContain('aria-label="Media assets"');
  });
});
