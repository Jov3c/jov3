<script setup lang="ts">
import type { PublicPost } from '~/types/blog';
import { formatPostDateTime } from '~/utils/content';

const props = defineProps<{ post: PublicPost; featured?: boolean }>();

const prototypeData: Record<
  string,
  Pick<PublicPost, 'excerpt' | 'viewCount' | 'commentCount' | 'wordCount'>
> = {
  server: {
    excerpt:
      '整理服务器后意识到未备份，于是把数据库、Nginx 配置和关键文件纳入自动备份，并为历史回滚保留清晰路径。',
    viewCount: 112,
    commentCount: 4,
    wordCount: 1963,
  },
  ai: {
    excerpt:
      '模型跑起来只是第一步。真正值得考虑的是哪些任务适合长期留在本地运行，而不是停留在一次聊天。',
    viewCount: 286,
    commentCount: 9,
    wordCount: 2380,
  },
  product: {
    excerpt: '功能越来越多并不一定意味着产品越来越完整，有时候反而意味着主线变得越来越模糊。',
    viewCount: 173,
    commentCount: 6,
    wordCount: 1755,
  },
  wechat: {
    excerpt: '从编辑、预览同步到模板管理，记录 WeChat-md 这个项目背后的一些设计选择。',
    viewCount: 214,
    commentCount: 3,
    wordCount: 2214,
  },
  signal: {
    excerpt: '信息产品真正难的地方，不是抓到更多内容，而是决定什么应该被看见，以及什么时候被看见。',
    viewCount: 327,
    commentCount: 11,
    wordCount: 2860,
  },
};

const display = computed(() => prototypeData[props.post.slug] ?? props.post);
</script>

<template>
  <NuxtLink
    class="post-card"
    :class="{ 'post-card--featured': featured }"
    :to="`/blog/${post.slug}`"
  >
    <div
      class="post-card__cover"
      :data-cover="post.category.slug"
      :style="post.cover ? { backgroundImage: `url(${post.cover.publicUrl})` } : undefined"
    />
    <div class="post-card__content">
      <p class="post-meta">
        <span class="post-meta__category">▱ {{ post.category.name }}</span>
        <span>◷ {{ formatPostDateTime(post.publishedAt ?? '') }}</span>
      </p>
      <h2>{{ post.title }}</h2>
      <p>{{ display.excerpt }}</p>
      <div class="post-stats">
        <span>◉ {{ display.viewCount }}</span
        ><span>▢ {{ display.commentCount }}</span
        ><span>▤ {{ display.wordCount }} 字</span>
      </div>
    </div>
  </NuxtLink>
</template>
