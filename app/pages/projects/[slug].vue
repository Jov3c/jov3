<script setup lang="ts">
import type { ProjectDetailResponse } from '~/types/project';

const route = useRoute();
definePageMeta({ layout: 'blog-prototype' });
const slug = String(route.params.slug);
const { data, error } = await useFetch<ProjectDetailResponse>(
  () => `/api/v1/public/projects/${encodeURIComponent(slug)}`,
  { key: `public-project-${slug}` },
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 503,
    statusMessage: error.value.statusMessage || '未找到项目',
  });
}

const project = data.value?.data;

if (!project) {
  throw createError({ statusCode: 404, statusMessage: '未找到项目' });
}

usePageSeo({
  title: `${project.name} — 项目 — Jov3`,
  description: project.summary,
});
</script>

<template>
  <div class="page-container project-readme-page">
    <NuxtLink class="back-link" to="/projects">← 返回项目</NuxtLink>
    <section class="project-readme-shell">
      <div class="project-readme-head">README.md</div>
      <article class="project-prototype-readme">
        <!-- The API returns HTML after the shared server-side Markdown sanitizer. -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="readme__content" v-html="project.readmeHtml" />
      </article>
    </section>
  </div>
</template>

<style src="~/assets/css/public.css"></style>
