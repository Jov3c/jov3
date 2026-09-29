<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import type { PublicPostDetail } from '~/types/blog';
import { formatPostDate } from '~/utils/content';

const route = useRoute();
const { data: post, error } = await useFetch<{ data: PublicPostDetail }>(
  `/api/v1/public/posts/${encodeURIComponent(String(route.params.slug))}`,
);

if (!post.value?.data) {
  throw createError({
    statusCode: error.value?.statusCode === 404 ? 404 : 503,
    statusMessage: error.value?.statusMessage ?? 'Post not found',
  });
}

const article = post.value.data;
useSeoMeta({
  title: `${article.seoTitle || article.title} — Jov3`,
  description: article.seoDescription || article.excerpt,
});
</script>

<template>
  <BlogChrome>
    <template #hero>
      <header class="article-header">
        <NuxtLink class="back-link" to="/blog">← 返回 Blog</NuxtLink>
        <p class="eyebrow">
          {{ article.category.name }} · {{ formatPostDate(article.publishedAt ?? '') }}
        </p>
        <h1>{{ article.title }}</h1>
        <p>{{ article.excerpt }}</p>
        <div class="post-stats">
          <span>{{ article.viewCount }} views</span><span>{{ article.commentCount }} comments</span
          ><span>{{ article.wordCount }} words</span>
        </div>
        <img
          v-if="article.cover"
          class="article-cover"
          :src="article.cover.publicUrl"
          :alt="article.cover.altText || article.title"
        />
      </header>
    </template>
    <article class="article-page">
      <NuxtLink class="back-link" to="/blog">← All posts</NuxtLink>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="article-body readme__content" v-html="article.contentHtml" />
    </article>
  </BlogChrome>
</template>
