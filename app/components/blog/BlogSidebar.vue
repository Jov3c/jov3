<script setup lang="ts">
import SidebarProfileCard from './SidebarProfileCard.vue';
import SidebarSiteInfoCard from './SidebarSiteInfoCard.vue';
import type { PublicSiteStatsResponse } from '~/types/stats';
import type { PublicHomeResponse } from '~/types/home';

const { data: homeResponse } = await useFetch<PublicHomeResponse>('/api/v1/public/home', {
  key: 'public-home-meta',
});

const { data: statsResponse } = await useFetch<PublicSiteStatsResponse>(
  '/api/v1/public/site/stats',
  { key: 'public-site-stats' },
);

const siteStats = computed(() => statsResponse.value?.data);
const home = computed(() => homeResponse.value?.data);
</script>

<template>
  <aside class="blog-sidebar" aria-label="博客信息">
    <SidebarProfileCard
      :stats="siteStats"
      :profile="home?.homeProfile"
      :social-links="home?.socialLinks"
      :contact-email="home?.siteProfile.publicContactEmail"
    />
    <SidebarSiteInfoCard :stats="siteStats" />
  </aside>
</template>
