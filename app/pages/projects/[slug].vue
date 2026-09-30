<script setup lang="ts">
import { PROJECT_STATUS_LABELS } from '#shared/constants/project';
import type { ProjectDetailResponse } from '~/types/project';

const route = useRoute();
const slug = String(route.params.slug);
const { data, error } = await useFetch<ProjectDetailResponse>(
  () => `/api/v1/public/projects/${encodeURIComponent(slug)}`,
  { key: `public-project-${slug}` },
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 503,
    statusMessage: error.value.statusMessage || 'Project not found',
  });
}

const project = data.value?.data;

if (!project) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found' });
}

usePageSeo({
  title: `${project.name} — Projects — Jov3`,
  description: project.summary,
});
</script>

<template>
  <div class="page-container project-detail">
    <NuxtLink class="back-link" to="/projects">← All projects</NuxtLink>

    <header class="project-detail__hero">
      <div>
        <p class="eyebrow">Project · {{ PROJECT_STATUS_LABELS[project.status] }}</p>
        <h1>{{ project.name }}</h1>
        <p>{{ project.summary }}</p>
      </div>
      <div class="project-actions">
        <a
          v-if="project.githubUrl"
          class="button button--ghost"
          :href="project.githubUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
        <span v-else class="button button--ghost button--disabled">GitHub</span>
        <a
          v-if="project.demoUrl"
          class="button"
          :href="project.demoUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Live Demo ↗
        </a>
        <span v-else class="button button--disabled" aria-disabled="true" title="暂无在线预览">
          Live Demo
        </span>
      </div>
    </header>

    <div class="readme-layout">
      <aside class="readme-meta">
        <p>STACK</p>
        <ul class="tag-list">
          <li v-for="technology in project.techStack" :key="technology">{{ technology }}</li>
        </ul>
      </aside>

      <article class="readme">
        <div class="readme__label">README.md</div>
        <!-- The API returns HTML after the shared server-side Markdown sanitizer. -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="readme__content" v-html="project.readmeHtml" />
      </article>
    </div>
  </div>
</template>
