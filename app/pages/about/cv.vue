<script setup lang="ts">
import type { PublicCvResponse } from '~/types/cv';

const { data, error } = await useFetch<PublicCvResponse>('/api/v1/public/cv', {
  key: 'public-cv',
});

if (!data.value) {
  throw createError({
    statusCode: error.value?.statusCode === 404 ? 404 : 503,
    statusMessage: error.value?.statusMessage || 'CV is not available',
  });
}

const cv = computed(() => data.value!.data);

useSeoMeta({
  title: 'CV — About — Jov3',
  description: 'Jov3 的个人工作档案、经历、项目和技能。',
});

function printCv() {
  window.print();
}

function formatMonth(value: string) {
  const [year, month] = value.split('-');
  return `${year}.${month}`;
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean) {
  return `${formatMonth(start)} — ${isCurrent ? 'PRESENT' : end ? formatMonth(end) : '—'}`;
}

function websiteLabel(value: string | null) {
  if (!value) return '—';
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value;
  }
}
</script>

<template>
  <div class="page-container cv-page">
    <header class="cv-hero">
      <div>
        <p class="eyebrow">About / Curriculum Vitae</p>
        <h1>CV, but make it mine.</h1>
        <p>
          不是传统的一页纸模板，而是一张可以持续更新的个人工作档案。保留专业信息，也保留一点个人气质。
        </p>
      </div>
      <button class="button button--ghost print-button" type="button" @click="printCv">
        Print / PDF
      </button>
    </header>

    <section class="cv-profile">
      <img
        v-if="cv.profile.portrait"
        class="cv-profile__portrait"
        :src="cv.profile.portrait.publicUrl"
        :alt="cv.profile.portrait.altText || cv.profile.name"
      />
      <div v-else class="cv-monogram">J3</div>
      <div>
        <h2>{{ cv.profile.name }}</h2>
        <p>{{ cv.profile.headline }} · {{ cv.profile.location }}</p>
      </div>
      <p>{{ cv.profile.bio }}</p>
      <div class="cv-profile__meta">
        <span>{{ cv.profile.location }}</span>
        <a v-if="cv.profile.website" :href="cv.profile.website" target="_blank" rel="noreferrer">
          {{ websiteLabel(cv.profile.website) }}
        </a>
        <span v-if="cv.profile.statusText">{{ cv.profile.statusText }}</span>
      </div>
    </section>

    <div class="cv-grid">
      <section class="cv-panel cv-panel--wide">
        <header>
          <h2>Experience</h2>
          <span>Work / Practice</span>
        </header>
        <article v-for="item in cv.experiences" :key="item.id" class="cv-entry">
          <time
            >{{ formatDateRange(item.startDate, item.endDate, item.isCurrent) }}<br />{{
              item.location
            }}</time
          >
          <div>
            <h3>{{ item.role }} · {{ item.company }}</h3>
            <span>Infrastructure / Operations</span>
            <p>{{ item.description }}</p>
          </div>
        </article>
      </section>

      <section class="cv-panel cv-panel--wide">
        <header>
          <h2>Selected projects</h2>
          <span>Things I build</span>
        </header>
        <div class="cv-projects">
          <article v-for="(project, index) in cv.projects" :key="project.id">
            <span>{{ String(index + 1).padStart(2, '0') }} / {{ project.status }}</span>
            <h3>
              <NuxtLink :to="`/projects/${project.slug}`">{{ project.name }}</NuxtLink>
            </h3>
            <p>{{ project.summary }}</p>
          </article>
        </div>
      </section>

      <section class="cv-panel">
        <header>
          <h2>Skills & Stack</h2>
          <span>Working set</span>
        </header>
        <ul class="cv-skills cv-skills--groups">
          <li v-for="skill in cv.skills" :key="skill.id">
            <strong>{{ skill.title }}</strong>
            <span>{{ skill.content }}</span>
          </li>
        </ul>
      </section>

      <section class="cv-panel">
        <header>
          <h2>Education</h2>
          <span>Background</span>
        </header>
        <article v-for="item in cv.educations" :key="item.id" class="cv-education">
          <time>{{ formatDateRange(item.startDate, item.endDate, false) }}</time>
          <h3>{{ item.school }}</h3>
          <span>{{ item.major }} · {{ item.degree }}</span>
          <p>{{ item.description }}</p>
        </article>
      </section>
    </div>

    <blockquote class="cv-statement">
      <p>{{ cv.profile.statement }}</p>
      <small>JOV3 · 2026</small>
    </blockquote>
  </div>
</template>
