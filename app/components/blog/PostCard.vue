<script setup lang="ts">
import type { BlogPost } from '~/types/content';
import { formatPostDate } from '~/utils/content';

defineProps<{ post: BlogPost; featured?: boolean }>();
</script>

<template>
  <NuxtLink
    class="post-card"
    :class="{ 'post-card--featured': featured }"
    :to="`/blog/${post.slug}`"
  >
    <div class="post-card__cover" :data-cover="post.slug">
      <span>{{ post.category }}</span>
      <b>{{ post.slug.slice(0, 2).toUpperCase() }}</b>
    </div>
    <div class="post-card__content">
      <p class="post-meta">{{ formatPostDate(post.publishedAt) }} · {{ post.category }}</p>
      <h2>{{ post.title }}</h2>
      <p>{{ post.summary }}</p>
      <div class="post-stats">
        <span>{{ post.views }} views</span><span>{{ post.comments }} comments</span
        ><span>{{ post.words }} words</span>
      </div>
    </div>
  </NuxtLink>
</template>
