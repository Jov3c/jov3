<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import { findPost, formatPostDate } from '~/utils/content';

const route = useRoute();
const post = findPost(String(route.params.slug));

if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' });

useSeoMeta({ title: `${post.title} — Jov3`, description: post.summary });
</script>

<template>
  <BlogChrome>
    <article class="article-page">
      <NuxtLink class="back-link" to="/blog">← All posts</NuxtLink>
      <header class="article-header">
        <p class="eyebrow">{{ post.category }} · {{ formatPostDate(post.publishedAt) }}</p>
        <h1>{{ post.title }}</h1>
        <p>{{ post.summary }}</p>
        <div class="post-stats">
          <span>{{ post.views }} views</span><span>{{ post.comments }} comments</span
          ><span>{{ post.words }} words</span>
        </div>
      </header>
      <div class="article-body">
        <p v-for="paragraph in post.body" :key="paragraph">{{ paragraph }}</p>
      </div>
    </article>
  </BlogChrome>
</template>
