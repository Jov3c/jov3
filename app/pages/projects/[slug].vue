<script setup lang="ts">
import AppButton from '~/components/ui/AppButton.vue';
import { findProject } from '~/utils/content';

const route = useRoute();
const project = findProject(String(route.params.slug));

if (!project) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found' });
}

useSeoMeta({
  title: `${project.name} — Projects — Jov3`,
  description: project.description,
});
</script>

<template>
  <div class="page-container project-detail">
    <NuxtLink class="back-link" to="/projects">← All projects</NuxtLink>

    <header class="project-detail__hero">
      <div>
        <p class="eyebrow">Project {{ project.index }} · {{ project.status }}</p>
        <h1>{{ project.name }}</h1>
        <p>{{ project.description }}</p>
      </div>
      <div class="project-actions">
        <AppButton href="https://github.com/Jov3c" variant="ghost">{{
          project.repositoryLabel
        }}</AppButton>
        <AppButton v-if="project.hasDemo" to="/">Live demo</AppButton>
      </div>
    </header>

    <div class="readme-layout">
      <aside class="readme-meta">
        <p>STACK</p>
        <ul class="tag-list">
          <li v-for="technology in project.stack" :key="technology">{{ technology }}</li>
        </ul>
      </aside>

      <article class="readme">
        <div class="readme__label">README.md</div>
        <p class="readme__lead">{{ project.readme.lead }}</p>
        <section v-for="section in project.readme.sections" :key="section.title">
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          <ul v-if="section.bullets">
            <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </section>
      </article>
    </div>
  </div>
</template>
