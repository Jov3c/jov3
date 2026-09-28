<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import PostCard from '~/components/blog/PostCard.vue';
import PageHeading from '~/components/ui/PageHeading.vue';
import { blogPosts } from '~/data/content';

useSeoMeta({ title: 'Blog — Jov3', description: 'AI、产品、开发，以及那些值得慢慢写下来的东西。' });
</script>

<template>
  <BlogChrome>
    <PageHeading
      eyebrow="Journal / 2026"
      title="Writing, slowly."
      description="AI、产品、开发，以及那些值得慢慢写下来的东西。"
    />
    <div class="post-list">
      <PostCard
        v-for="(post, index) in blogPosts"
        :key="post.slug"
        :post="post"
        :featured="index === 0"
      />
    </div>
  </BlogChrome>
</template>
