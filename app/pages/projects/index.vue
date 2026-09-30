<script setup lang="ts">
import ProjectCard from '~/components/projects/ProjectCard.vue';
import StandardHero from '~/components/ui/StandardHero.vue';
import type { ProjectListResponse } from '~/types/project';

const { data, error, pending } = await useFetch<ProjectListResponse>('/api/v1/public/projects', {
  key: 'public-projects',
});

if (error.value) {
  throw createError({ statusCode: 503, statusMessage: 'Projects are temporarily unavailable' });
}

const projects = computed(() => data.value?.data.items ?? []);
const projectCount = computed(() => String(projects.value.length).padStart(2, '0'));

usePageSeo({
  title: 'Projects — Jov3',
  description: '一些正在构建、持续维护或已经完成的项目。',
});
</script>

<template>
  <div class="page-container">
    <StandardHero
      :eyebrow="`Projects / 01—${projectCount}`"
      title="Selected work."
      description="一些正在构建、持续维护或已经完成的项目。点击卡片进入项目 README。"
    />

    <div v-if="pending" class="projects-grid projects-grid--loading" aria-label="加载项目">
      <div v-for="item in 6" :key="item" class="project-card project-card--skeleton">
        <span class="skeleton-block skeleton-block--short" />
        <span class="skeleton-block skeleton-block--title" />
        <span class="skeleton-block skeleton-block--copy" />
      </div>
    </div>
    <div v-else-if="projects.length" class="projects-grid">
      <ProjectCard
        v-for="(project, index) in projects"
        :key="project.id"
        :project="project"
        :index="index"
      />
    </div>
    <p v-else class="projects-empty">还没有公开项目。</p>
  </div>
</template>
