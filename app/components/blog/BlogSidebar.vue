<script setup lang="ts">
import SidebarProfileCard from './SidebarProfileCard.vue';
import SidebarSiteInfoCard from './SidebarSiteInfoCard.vue';
import type { BlogCategory, PublicCategoriesResponse } from '~/types/blog';
import type { PublicSiteStatsResponse } from '~/types/stats';

const categoriesState = useState('public-blog-categories', () => [] as BlogCategory[]);
const { data } = await useFetch<PublicCategoriesResponse>('/api/v1/public/categories', {
  key: 'public-blog-categories',
});
const { data: statsResponse } = await useFetch<PublicSiteStatsResponse>(
  '/api/v1/public/site/stats',
  { key: 'public-site-stats' },
);

categoriesState.value = data.value?.data ?? [];
const stats = computed(() => data.value?.meta.stats);
const siteStats = computed(() => statsResponse.value?.data);
</script>

<template>
  <aside class="blog-sidebar" aria-label="博客信息">
    <SidebarProfileCard :stats="stats" />
    <SidebarSiteInfoCard :categories="categoriesState" :stats="siteStats" />
  </aside>
</template>
