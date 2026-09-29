<script setup lang="ts">
import { PROJECT_STATUS_LABELS } from '#shared/constants/project';
import type { PublicProject } from '~/types/project';

defineProps<{ project: PublicProject; index: number }>();
</script>

<template>
  <article class="project-card">
    <NuxtLink class="project-card__link" :to="`/projects/${project.slug}`">
      <div class="project-card__top">
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="status-pill" :data-status="project.status.toLowerCase()">
          {{ PROJECT_STATUS_LABELS[project.status] }}
        </span>
      </div>
      <div class="project-card__body">
        <h2>{{ project.name }}</h2>
        <p>{{ project.summary }}</p>
      </div>
      <div class="project-card__footer">
        <ul class="tag-list" aria-label="技术栈">
          <li v-for="technology in project.techStack" :key="technology">{{ technology }}</li>
        </ul>
        <span class="project-arrow" aria-hidden="true">↗</span>
      </div>
    </NuxtLink>
    <div class="project-card__actions" aria-label="项目链接">
      <a
        v-if="project.githubUrl"
        class="project-card__action"
        :href="project.githubUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub ↗
      </a>
      <span v-else class="project-card__action project-card__action--muted">GitHub</span>
      <a
        v-if="project.demoUrl"
        class="project-card__action"
        :href="project.demoUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Live Demo ↗
      </a>
      <span
        v-else
        class="project-card__action project-card__action--disabled"
        aria-disabled="true"
        title="暂无在线预览"
      >
        Live Demo
      </span>
    </div>
  </article>
</template>
