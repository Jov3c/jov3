<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import StandardHero from '~/components/ui/StandardHero.vue';
import { friendLinks } from '~/data/content';

useSeoMeta({ title: 'Links — Blog — Jov3', description: '一些常去的站点，和互联网里的朋友。' });
</script>

<template>
  <BlogChrome>
    <StandardHero
      eyebrow="Blogroll"
      title="Good places on the web."
      description="一些常去的站点，和互联网里的朋友。只有已确认的地址可以跳转。"
    />
    <div class="friend-grid">
      <component
        :is="friend.url ? 'a' : 'div'"
        v-for="friend in friendLinks"
        :key="friend.name"
        class="friend-card"
        :class="{ 'friend-card--pending': !friend.url }"
        :href="friend.url"
        :target="friend.url ? '_blank' : undefined"
        :rel="friend.url ? 'noreferrer' : undefined"
      >
        <span class="friend-avatar">{{ friend.initials }}</span>
        <span
          ><strong>{{ friend.name }}</strong
          ><small>{{ friend.description }}</small></span
        >
        <b>{{ friend.url ? '↗' : '待确认' }}</b>
      </component>
    </div>
  </BlogChrome>
</template>
