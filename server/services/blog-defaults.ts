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
    excerpt:
      '整理服务器后意识到未备份，于是把数据库、Nginx 配置和关键文件纳入自动备份，并为历史回滚保留清晰路径。',
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
    excerpt:
      '模型跑起来只是第一步。真正值得考虑的是哪些任务适合长期留在本地运行，而不是停留在一次聊天。',
    publishedAt: '2026-09-12T21:10:00+08:00',
    markdownBody: `# 本地部署大模型之后，我们应该让它做什么？

部署成功不是终点，而是工作流设计的开始。

更值得长期运行的场景包括知识库、隐私数据处理和自动化工具。真正重要的不是模型参数，而是它是否让日常工作变得更清晰。`,
  },
  {
    slug: 'product',
    category: 'product',
    title: '我为什么越来越少给产品堆功能',
    excerpt: '功能越来越多并不一定意味着产品越来越完整，有时候反而意味着主线变得越来越模糊。',
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
    excerpt: '信息产品真正难的地方，不是抓到更多内容，而是决定什么应该被看见，以及什么时候被看见。',
    publishedAt: '2026-08-20T10:08:00+08:00',
    markdownBody: `# Signal Daily：从信息聚合到低噪音阅读

聚合只是入口，减少噪音才是 Signal Daily 真正想解决的问题。

当来源不断增加，产品需要替用户保护注意力，而不是展示自己抓到了多少内容。`,
  },
  {
    slug: 'long-term-projects',
    category: 'essay',
    title: '一些关于长期做项目的想法',
    excerpt: '关于耐心、取舍和持续维护的一些记录。',
    publishedAt: '2026-08-11T12:00:00+08:00',
    markdownBody: '# 一些关于长期做项目的想法\n\n真正困难的不是开始，而是持续维护。',
  },
  {
    slug: 'product-boundary',
    category: 'product',
    title: '从一个小工具开始理解产品边界',
    excerpt: '边界清楚的小工具，往往比什么都想做的产品更有生命力。',
    publishedAt: '2026-07-27T12:00:00+08:00',
    markdownBody: '# 从一个小工具开始理解产品边界\n\n先把最重要的一件事做好。',
  },
  {
    slug: 'local-model-workflow',
    category: 'ai',
    title: '关于本地模型工作流的一次整理',
    excerpt: '整理本地模型在实际工作中的位置与边界。',
    publishedAt: '2026-07-09T12:00:00+08:00',
    markdownBody: '# 关于本地模型工作流的一次整理\n\n模型需要进入工作流，才会产生长期价值。',
  },
  {
    slug: 'things-built-2025',
    category: 'essay',
    title: '今年做过的一些东西',
    excerpt: '回看这一年做过、放弃和留下来的项目。',
    publishedAt: '2025-12-21T12:00:00+08:00',
    markdownBody: '# 今年做过的一些东西\n\n有些完成了，有些仍在继续。',
  },
  {
    slug: 'automate-repetition',
    category: 'development',
    title: '把重复的工作交给自动化',
    excerpt: '从最常发生的重复动作开始建立自动化。',
    publishedAt: '2025-12-05T12:00:00+08:00',
    markdownBody: '# 把重复的工作交给自动化\n\n自动化应该让结果更容易确认。',
  },
  {
    slug: 'prototype-structure',
    category: 'product',
    title: '产品原型为什么应该先解决结构',
    excerpt: '视觉之前，先把信息与操作关系理清楚。',
    publishedAt: '2025-11-14T12:00:00+08:00',
    markdownBody: '# 产品原型为什么应该先解决结构\n\n结构决定了用户如何理解产品。',
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

  for (const post of DEFAULT_POSTS) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
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
      },
    });
  }
  return true;
}
