<script setup lang="ts">
import type { PublicPost } from '~/types/blog';
import { formatPostDate } from '~/utils/content';

defineProps<{ post: PublicPost; featured?: boolean }>();
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
    >
      <span>{{ post.category.name }}</span>
      <b>{{ post.slug.slice(0, 2).toUpperCase() }}</b>
    </div>
    <div class="post-card__content">
      <p class="post-meta">
        {{ formatPostDate(post.publishedAt ?? '') }} · {{ post.category.name }}
      </p>
      <h2>{{ post.title }}</h2>
      <p>{{ post.excerpt }}</p>
      <div class="post-stats">
        <span>{{ post.viewCount }} views</span><span>{{ post.commentCount }} comments</span
        ><span>{{ post.wordCount }} words</span>
      </div>
    </div>
  </NuxtLink>
</template>
