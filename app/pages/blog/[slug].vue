<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import CommentSection from '~/components/blog/CommentSection.vue';
import type { PublicPostDetail } from '~/types/blog';
import { formatPostDate } from '~/utils/content';

const route = useRoute();
definePageMeta({ layout: 'blog-prototype' });
const { data: post, error } = await useFetch<{ data: PublicPostDetail }>(
  `/api/v1/public/posts/${encodeURIComponent(String(route.params.slug))}`,
);

if (!post.value?.data) {
  throw createError({
    statusCode: error.value?.statusCode === 404 ? 404 : 503,
    statusMessage: error.value?.statusMessage ?? '未找到文章',
  });
}

const article = post.value.data;
usePageSeo({
  title: `${article.seoTitle || article.title} — Jov3`,
  description: article.seoDescription || article.excerpt,
  type: 'article',
  image: article.cover?.publicUrl,
  publishedAt: article.publishedAt,
});
</script>

<template>
  <BlogChrome :show-sidebar="false" :show-subnav="false">
    <article class="article-page">
      <NuxtLink class="back-link" to="/blog">← 返回博客</NuxtLink>
      <header class="article-page__header">
        <h1>{{ article.title }}</h1>
        <p>
          {{ article.category.name }} · {{ formatPostDate(article.publishedAt ?? '') }} ·
          {{ article.viewCount }} 次阅读 · {{ article.commentCount }} 条评论 ·
          {{ article.wordCount }} 字
        </p>
      </header>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="article-body readme__content" v-html="article.contentHtml" />
    </article>
    <CommentSection :slug="article.slug" />
  </BlogChrome>
</template>
