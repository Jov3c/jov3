<script setup lang="ts">
import type { Project } from '~/types/content';

defineProps<{ project: Project }>();
</script>

<template>
  <NuxtLink class="project-card" :to="`/projects/${project.slug}`">
    <div class="project-card__top">
      <span>{{ project.index }}</span>
      <span class="status-pill" :data-status="project.status.toLowerCase()">{{
        project.status
      }}</span>
    </div>
    <div>
      <h2>{{ project.name }}</h2>
      <p>{{ project.description }}</p>
    </div>
    <div class="project-card__footer">
      <ul class="tag-list" aria-label="技术栈">
        <li v-for="technology in project.stack" :key="technology">{{ technology }}</li>
      </ul>
      <span class="project-arrow" aria-hidden="true">↗</span>
    </div>
  </NuxtLink>
</template>
