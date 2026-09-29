import type { PrismaClient } from '../generated/prisma/client';

import { countMarkdownWords } from '../../shared/word-count';

const DEFAULT_CATEGORIES = [
  { slug: 'development', name: '开发', sortOrder: 10, visible: true },
  { slug: 'ai', name: 'AI', sortOrder: 20, visible: true },
  { slug: 'product', name: '产品', sortOrder: 30, visible: true },
  { slug: 'essay', name: '随笔', sortOrder: 40, visible: true },
] as const;

const DEFAULT_POSTS = [
  {
    slug: 'server',
    category: 'development',
    title: '博客服务器的自动巡检和基于 Git 的备份',
    excerpt: '把常见检查、异常提示与内容备份串成一条足够简单、可以长期运行的自动化流程。',
    publishedAt: '2026-09-18T16:37:00+08:00',
    markdownBody: `# 博客服务器的自动巡检和基于 Git 的备份

网站上线之后，真正需要时间的往往不是第一次部署，而是长期维护。

我把磁盘、服务状态、证书与备份拆成几个小检查，再用 Git 保留内容变更。流程不复杂，但每一步都能独立确认和恢复。

## 让维护变得可确认

自动化的价值不是把所有事情藏起来，而是让每一次检查都有明确结果。`,
  },
  {
    slug: 'ai',
    category: 'ai',
    title: '本地部署大模型之后，我们应该让它做什么？',
    excerpt: '从“成功跑起来”继续往前，寻找真正值得长期留在本地的工作流。',
    publishedAt: '2026-09-12T21:10:00+08:00',
    markdownBody: `# 本地部署大模型之后，我们应该让它做什么？

部署成功不是终点，而是工作流设计的开始。

更值得长期运行的场景包括知识库、隐私数据处理和自动化工具。真正重要的不是模型参数，而是它是否让日常工作变得更清晰。`,
  },
  {
    slug: 'product',
    category: 'product',
    title: '我为什么越来越少给产品堆功能',
    excerpt: '功能数量并不会自然变成产品价值，有时真正困难的是判断哪些东西不应该出现。',
    publishedAt: '2026-09-04T12:26:00+08:00',
    markdownBody: `# 我为什么越来越少给产品堆功能

一个功能被做出来之后，就会开始占用理解、维护和沟通成本。

我更愿意先问：如果删掉它，产品的核心是否仍然完整？`,
  },
  {
    slug: 'wechat',
    category: 'development',
    title: '做一个真正适合公众号写作的 Markdown 编辑器',
    excerpt: '从编辑、预览同步到模板管理，记录 WeChat-md 这个项目背后的一些设计选择。',
    publishedAt: '2026-08-28T18:42:00+08:00',
    markdownBody: `# 做一个真正适合公众号写作的 Markdown 编辑器

写作工具最重要的能力，是让人把注意力留在内容上。

预览和模板不是额外装饰，它们应该缩短从草稿到发布的距离。`,
  },
  {
    slug: 'signal',
    category: 'product',
    title: 'Signal Daily：从信息聚合到低噪音阅读',
    excerpt: '重新整理信息产品中的获取、筛选和阅读，让每天打开它时都更轻一点。',
    publishedAt: '2026-08-20T10:08:00+08:00',
    markdownBody: `# Signal Daily：从信息聚合到低噪音阅读

聚合只是入口，减少噪音才是 Signal Daily 真正想解决的问题。

当来源不断增加，产品需要替用户保护注意力，而不是展示自己抓到了多少内容。`,
  },
] as const;

export async function seedBlogDefaults(prisma: PrismaClient) {
  const categories = new Map<string, string>();
  for (const category of DEFAULT_CATEGORIES) {
    const record = await prisma.postCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    categories.set(record.slug, record.id);
  }

  if ((await prisma.post.count()) > 0) return false;

  await prisma.post.createMany({
    data: DEFAULT_POSTS.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      categoryId: categories.get(post.category)!,
      coverMediaId: null,
      markdownBody: post.markdownBody,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(post.publishedAt),
      wordCount: countMarkdownWords(post.markdownBody),
      viewCount: BigInt(0),
      seoTitle: null,
      seoDescription: null,
    })),
  });
  return true;
}
