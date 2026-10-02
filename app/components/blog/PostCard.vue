<script setup lang="ts">
import type { PublicPost } from '~/types/blog';
import { formatPostDateTime } from '~/utils/content';

defineProps<{ post: PublicPost; featured?: boolean; coverVariant?: number }>();
</script>

<template>
  <NuxtLink
    class="post-card"
    :class="{ 'post-card--featured': featured }"
    :to="`/blog/${post.slug}`"
  >
    <div class="post-card__cover">
      <div
        class="post-card__cover-art"
        :data-cover="post.category.slug"
        :data-cover-index="coverVariant"
        :style="post.cover ? { backgroundImage: `url(${post.cover.publicUrl})` } : undefined"
      />
    </div>
    <div class="post-card__content">
      <p class="post-meta">
        <span class="post-meta__category">▱ {{ post.category.name }}</span>
        <span>◷ {{ formatPostDateTime(post.publishedAt ?? '') }}</span>
      </p>
      <h2>{{ post.title }}</h2>
      <p>{{ post.excerpt }}</p>
      <div class="post-stats">
        <span>◉ {{ post.viewCount }}</span
        ><span>▢ {{ post.commentCount }}</span
        ><span>▤ {{ post.wordCount }} 字</span>
      </div>
    </div>
  </NuxtLink>
</template>
