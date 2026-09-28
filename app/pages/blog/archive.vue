<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import StandardHero from '~/components/ui/StandardHero.vue';
import { archiveEntries } from '~/data/content';

useSeoMeta({ title: 'Archive — Blog — Jov3', description: '按时间查看 Jov3 的全部文章。' });
</script>

<template>
  <BlogChrome>
    <StandardHero
      eyebrow="Archive"
      title="All posts, over time."
      description="按时间收好写过的文章，也保留一路变化的痕迹。"
    />
    <div class="archive-list">
      <section
        v-for="group in archiveEntries"
        :key="`${group.year}-${group.month}`"
        class="archive-group"
      >
        <h2>
          <span>{{ group.year }}</span
          >{{ group.month }}
        </h2>
        <ul>
          <li v-for="item in group.items" :key="`${item.date}-${item.title}`">
            <span>{{ item.date }}</span>
            <NuxtLink v-if="item.slug" :to="`/blog/${item.slug}`">{{ item.title }}</NuxtLink>
            <strong v-else>{{ item.title }}</strong>
            <small>{{ item.category }}</small>
          </li>
        </ul>
      </section>
    </div>
  </BlogChrome>
</template>
