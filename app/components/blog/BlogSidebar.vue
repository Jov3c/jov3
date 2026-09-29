<script setup lang="ts">
import SidebarProfileCard from './SidebarProfileCard.vue';
import SidebarSiteInfoCard from './SidebarSiteInfoCard.vue';
import type { BlogCategory, PublicCategoriesResponse } from '~/types/blog';

const categoriesState = useState('public-blog-categories', () => [] as BlogCategory[]);
const { data } = await useFetch<PublicCategoriesResponse>('/api/v1/public/categories', {
  key: 'public-blog-categories',
});

categoriesState.value = data.value?.data ?? [];
const stats = computed(() => data.value?.meta.stats);
</script>

<template>
  <aside class="blog-sidebar" aria-label="博客信息">
    <SidebarProfileCard :stats="stats" />
    <SidebarSiteInfoCard :categories="categoriesState" />
  </aside>
</template>
