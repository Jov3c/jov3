<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { data: homeResponse } = await useFetch<{
  data: { siteProfile: { siteTitle: string; siteDescription: string } };
}>('/api/v1/public/home', { key: 'public-home-meta' });

usePageSeo(() => ({
  title: homeResponse.value?.data.siteProfile.siteTitle || 'JOV3',
  description:
    homeResponse.value?.data.siteProfile.siteDescription ||
    'Building products, tools and ideas on the internet.',
}));
</script>
