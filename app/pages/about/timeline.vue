<script setup lang="ts">
import PageHeading from '~/components/ui/PageHeading.vue';
import { timelineChapters } from '~/data/content';

useSeoMeta({
  title: 'Timeline — About — Jov3',
  description: '做过的项目、改变方向的时刻、学到的东西，以及正在发生的生活。',
});
</script>

<template>
  <div class="page-container timeline-page">
    <PageHeading
      eyebrow="About / Timeline"
      title="A story still being written."
      description="不是简历，也不是履历表。只是把一些值得记住的节点留下来：做过的项目、改变方向的时刻、学到的东西，以及正在发生的生活。"
    />

    <nav class="year-index" aria-label="时间线年份">
      <a v-for="chapter in timelineChapters" :key="chapter.year" :href="`#year-${chapter.year}`">
        {{ chapter.year }}
      </a>
    </nav>

    <div class="timeline">
      <article
        v-for="(chapter, index) in timelineChapters"
        :id="`year-${chapter.year}`"
        :key="chapter.year"
        class="timeline-chapter"
        :class="{ 'timeline-chapter--now': chapter.year === 'NOW' }"
      >
        <div class="timeline-year">
          <span>{{ chapter.verb }}</span
          ><strong>{{ chapter.year }}</strong>
        </div>
        <div class="timeline-node"><i />{{ String(index + 1).padStart(2, '0') }}</div>
        <div class="story-card">
          <p>{{ chapter.tag }} · {{ chapter.year }}</p>
          <h2>{{ chapter.title }}</h2>
          <strong>{{ chapter.description }}</strong>
          <p>{{ chapter.story }}</p>
        </div>
      </article>
    </div>
  </div>
</template>
