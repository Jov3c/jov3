<script setup lang="ts">
import ProjectCard from '~/components/projects/ProjectCard.vue';
import StandardHero from '~/components/ui/StandardHero.vue';
import type { ProjectListResponse } from '~/types/project';

const { data, error, pending } = await useFetch<ProjectListResponse>('/api/v1/public/projects', {
  key: 'public-projects',
});

if (error.value) {
  throw createError({ statusCode: 503, statusMessage: '项目暂时无法访问' });
}

const projects = computed(() => data.value?.data.items ?? []);
const showPrototypeSkeleton = ref(true);

definePageMeta({ layout: 'blog-prototype' });

onMounted(() => window.setTimeout(() => (showPrototypeSkeleton.value = false), 850));

usePageSeo({
  title: 'Projects — Jov3',
  description: '一些正在构建、持续维护或已经完成的项目。',
});
</script>

<template>
  <div class="page-container projects-page">
    <StandardHero
      eyebrow="SELECTED WORK"
      title="Projects"
      description="一些正在构建、持续维护或已经完成的项目。点击卡片进入项目 README。"
    />

    <div class="projects-toolbar" aria-live="polite">
      <span v-if="showPrototypeSkeleton || pending">正在加载项目…</span>
      <span v-else>共 {{ projects.length }} 个项目</span>
    </div>

    <div
      v-if="showPrototypeSkeleton || pending"
      class="projects-grid projects-grid--loading"
      aria-label="加载项目"
    >
      <div v-for="item in 6" :key="item" class="project-card project-card--skeleton">
        <div class="project-skeleton__head">
          <span class="skeleton-block project-skeleton__title" />
          <span class="skeleton-block project-skeleton__status" />
        </div>
        <span class="skeleton-block project-skeleton__line project-skeleton__line--wide" />
        <span class="skeleton-block project-skeleton__line project-skeleton__line--medium" />
        <span class="skeleton-block project-skeleton__line project-skeleton__line--short" />
        <div class="project-skeleton__actions">
          <span class="skeleton-block project-skeleton__button" />
          <span class="skeleton-block project-skeleton__button" />
        </div>
        <div class="project-skeleton__tags">
          <span v-for="tag in 3" :key="tag" class="skeleton-block project-skeleton__tag" />
        </div>
      </div>
    </div>
    <div v-else-if="projects.length" class="projects-grid">
      <ProjectCard v-for="project in projects" :key="project.id" :project="project" />
    </div>
    <p v-else class="projects-empty">还没有公开项目。</p>
  </div>
</template>

<style src="~/assets/css/public.css"></style>
