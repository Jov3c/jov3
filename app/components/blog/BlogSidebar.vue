<script setup lang="ts">
import SidebarProfileCard from './SidebarProfileCard.vue';
import SidebarSiteInfoCard from './SidebarSiteInfoCard.vue';
import type { PublicSiteStatsResponse } from '~/types/stats';

const { data: statsResponse } = await useFetch<PublicSiteStatsResponse>(
  '/api/v1/public/site/stats',
  { key: 'public-site-stats' },
);

const stats = { totalPosts: 18, totalCategories: 4, totalWords: 28_510 };
const siteStats = computed(() => statsResponse.value?.data);
</script>

<template>
  <aside class="blog-sidebar" aria-label="博客信息">
    <SidebarProfileCard :stats="stats" />
    <SidebarSiteInfoCard :stats="siteStats" />
  </aside>
</template>
