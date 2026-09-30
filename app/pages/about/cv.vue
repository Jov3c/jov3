<script setup lang="ts">
import type { PublicCvResponse } from '~/types/cv';

definePageMeta({ layout: 'blog-prototype' });

const { data, error, refresh } = await useFetch<PublicCvResponse>('/api/v1/public/cv', {
  key: 'public-cv',
});

if (!data.value) {
  throw createError({
    statusCode: error.value?.statusCode === 404 ? 404 : 503,
    statusMessage: error.value?.statusMessage || '个人档案暂时无法访问',
  });
}

const cv = computed(() => data.value!.data);

usePageSeo({
  title: 'CV — About — Jov3',
  description: 'Jov3 的个人工作档案、经历、项目和技能。',
});

function printCv() {
  window.print();
}

function resetCv() {
  void refresh();
}

function formatMonth(value: string) {
  const [year, month] = value.split('-');
  return `${year}.${month}`;
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean) {
  return `${formatMonth(start)} — ${isCurrent ? '至今' : end ? formatMonth(end) : '—'}`;
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
  <div class="page-container cv-prototype-page">
    <section class="cv-prototype-hero">
      <div class="cv-prototype-hero__top">
        <div>
          <p class="eyebrow">CURRICULUM VITAE</p>
          <h1>CV, but make it mine.</h1>
          <p>
            不是传统的一页纸模板，而是一张可以持续更新的个人工作档案。保留专业信息，也保留一点个人气质。
          </p>
        </div>
        <div class="cv-prototype-actions">
          <NuxtLink class="cv-prototype-button" to="/admin/cv">Edit CV</NuxtLink>
          <button class="cv-prototype-button" type="button" @click="resetCv">Reset</button>
          <button
            class="cv-prototype-button cv-prototype-button--dark"
            type="button"
            @click="printCv"
          >
            Print / PDF
          </button>
        </div>
      </div>
    </section>

    <section class="cv-prototype-shell">
      <aside class="cv-identity">
        <img
          v-if="cv.profile.portrait"
          class="cv-portrait cv-portrait--image"
          :src="cv.profile.portrait.publicUrl"
          :alt="cv.profile.portrait.altText || cv.profile.name"
        />
        <div v-else class="cv-portrait">J3</div>
        <h2>{{ cv.profile.name }}</h2>
        <p class="cv-identity__headline">{{ cv.profile.headline }}</p>
        <p class="cv-identity__bio">{{ cv.profile.bio }}</p>
        <div class="cv-mini">
          <div>
            <span>所在地</span><span>{{ cv.profile.location }}</span>
          </div>
          <div>
            <span>网站</span><span>{{ websiteLabel(cv.profile.website) }}</span>
          </div>
          <div>
            <span>状态</span><span>{{ cv.profile.statusText || '—' }}</span>
          </div>
        </div>
        <div class="cv-tags">
          <span>AI 应用</span><span>产品</span><span>运维</span><span>自动化</span>
        </div>
        <div class="cv-links">
          <a href="https://github.com/Jov3c" target="_blank" rel="noreferrer">GitHub</a>
          <a href="mailto:hello@example.com">邮箱</a>
          <a href="/blog">博客</a>
        </div>
      </aside>

      <main class="cv-stack">
        <section class="cv-prototype-panel">
          <header><strong>工作经历</strong><span>工作 / 实践</span></header>
          <article v-for="item in cv.experiences" :key="item.id" class="cv-prototype-entry">
            <div class="cv-prototype-entry__when">
              {{ formatDateRange(item.startDate, item.endDate, item.isCurrent) }}<br />{{
                item.location
              }}
            </div>
            <div>
              <h3>{{ item.role }} · {{ item.company }}</h3>
              <small>技术 / 运维</small>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </section>

        <section class="cv-prototype-panel">
          <header><strong>精选项目</strong><span>我做过的东西</span></header>
          <div class="cv-prototype-projects">
            <article v-for="(project, index) in cv.projects" :key="project.id">
              <small>{{ String(index + 1).padStart(2, '0') }} / {{ project.status }}</small>
              <h3>
                <NuxtLink :to="`/projects/${project.slug}`">{{ project.name }}</NuxtLink>
              </h3>
              <p>{{ project.summary }}</p>
            </article>
          </div>
        </section>

        <section class="cv-prototype-panel">
          <header><strong>技能与技术栈</strong><span>当前工作集</span></header>
          <div class="cv-prototype-skills">
            <div v-for="skill in cv.skills" :key="skill.id">
              <strong>{{ skill.title }}</strong
              ><span>{{ skill.content }}</span>
            </div>
          </div>
        </section>

        <section class="cv-prototype-panel">
          <header><strong>教育经历</strong><span>学习背景</span></header>
          <article v-for="item in cv.educations" :key="item.id" class="cv-prototype-entry">
            <div class="cv-prototype-entry__when">
              {{ formatDateRange(item.startDate, item.endDate, false) }}
            </div>
            <div>
              <h3>{{ item.school }}</h3>
              <small>{{ item.major }} · {{ item.degree }}</small>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </section>

        <blockquote class="cv-prototype-quote">
          <p>{{ cv.profile.statement }}</p>
          <small>JOV3 · 2026</small>
        </blockquote>
      </main>
    </section>

    <footer class="cv-prototype-footer">
      <span>JOV3 / 个人简历</span><span>最后更新 · 2026</span>
    </footer>
  </div>
</template>
