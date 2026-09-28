<script setup lang="ts">
import ProjectCard from '~/components/projects/ProjectCard.vue';
import PageHeading from '~/components/ui/PageHeading.vue';
import { projects } from '~/data/content';

useSeoMeta({
  title: 'Projects — Jov3',
  description: '一些正在构建、持续维护或已经完成的项目。',
});
</script>

<template>
  <div class="page-container">
    <PageHeading
      eyebrow="Projects / 01—06"
      title="Selected work."
      description="一些正在构建、持续维护或已经完成的项目。点击卡片进入项目 README。"
    />

    <div class="projects-grid">
      <ProjectCard v-for="project in projects" :key="project.slug" :project="project" />
    </div>
  </div>
</template>
