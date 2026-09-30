<script setup lang="ts">
import { PROJECT_STATUS_LABELS } from '#shared/constants/project';
import type { PublicProject } from '~/types/project';

defineProps<{ project: PublicProject }>();
</script>

<template>
  <article class="project-card">
    <div class="project-card__head">
      <h2 class="project-card__name">
        <NuxtLink :to="`/projects/${project.slug}`">{{ project.name }}</NuxtLink>
      </h2>
      <span class="status-pill" :data-status="project.status.toLowerCase()">
        {{ PROJECT_STATUS_LABELS[project.status] }}
      </span>
    </div>

    <p class="project-card__description">{{ project.summary }}</p>

    <div class="project-card__actions" aria-label="项目链接">
      <a
        v-if="project.githubUrl"
        class="project-card__action"
        :href="project.githubUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        项目源码 ↗
      </a>
      <span v-else class="project-card__action project-card__action--muted">项目源码</span>
      <a
        v-if="project.demoUrl"
        class="project-card__action"
        :href="project.demoUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        在线预览 ↗
      </a>
      <span
        v-else
        class="project-card__action project-card__action--disabled"
        aria-disabled="true"
        title="暂无在线预览"
      >
        在线预览
      </span>
    </div>

    <ul class="tag-list" aria-label="技术栈">
      <li v-for="technology in project.techStack" :key="technology">{{ technology }}</li>
    </ul>
  </article>
</template>
