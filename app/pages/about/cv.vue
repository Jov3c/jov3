<script setup lang="ts">
import { cvProfile, projects } from '~/data/content';

function printCv() {
  window.print();
}

useSeoMeta({
  title: 'CV — About — Jov3',
  description: 'Jov3 的个人工作档案、经历、项目和技能。',
});
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
      <div class="cv-monogram">J3</div>
      <div>
        <h2>{{ cvProfile.name }}</h2>
        <p>{{ cvProfile.role }} · {{ cvProfile.location }}</p>
      </div>
      <p>{{ cvProfile.bio }}</p>
    </section>

    <div class="cv-grid">
      <section class="cv-panel cv-panel--wide">
        <header>
          <h2>Experience</h2>
          <span>Work / Practice</span>
        </header>
        <article v-for="item in cvProfile.experience" :key="item.period" class="cv-entry">
          <time>{{ item.period }}<br />{{ item.place }}</time>
          <div>
            <h3>{{ item.title }}</h3>
            <span>{{ item.subtitle }}</span>
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
          <article v-for="project in projects.slice(0, 4)" :key="project.slug">
            <span>{{ project.index }} / {{ project.status }}</span>
            <h3>{{ project.name }}</h3>
            <p>{{ project.description }}</p>
          </article>
        </div>
      </section>

      <section class="cv-panel">
        <header>
          <h2>Skills</h2>
          <span>Toolbox</span>
        </header>
        <ul class="cv-skills">
          <li v-for="skill in cvProfile.skills" :key="skill">{{ skill }}</li>
        </ul>
      </section>

      <section class="cv-panel">
        <header>
          <h2>Education</h2>
          <span>Foundation</span>
        </header>
        <article class="cv-education">
          <time>{{ cvProfile.education.period }}</time>
          <h3>{{ cvProfile.education.title }}</h3>
          <span>{{ cvProfile.education.subtitle }}</span>
          <p>{{ cvProfile.education.description }}</p>
        </article>
      </section>
    </div>

    <blockquote class="cv-statement">
      <p>{{ cvProfile.statement }}</p>
      <small>JOV3 · 2026</small>
    </blockquote>
  </div>
</template>
