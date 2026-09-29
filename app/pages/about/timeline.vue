<script setup lang="ts">
import StandardHero from '~/components/ui/StandardHero.vue';
import type { PublicTimelineResponse } from '~/types/timeline';

const { data, error } = await useFetch<PublicTimelineResponse>('/api/v1/public/timeline', {
  key: 'public-timeline',
});

if (!data.value) {
  throw createError({
    statusCode: error.value?.statusCode || 503,
    statusMessage: 'Timeline is not available',
  });
}

const entries = computed(() => data.value!.data);

useSeoMeta({
  title: 'Timeline — About — Jov3',
  description: '做过的项目、改变方向的时刻、学到的东西，以及正在发生的生活。',
});
</script>

<template>
  <div class="page-container timeline-page">
    <StandardHero
      eyebrow="About / Timeline"
      title="A story still being written."
      description="不是简历，也不是履历表。只是把一些值得记住的节点留下来：做过的项目、改变方向的时刻、学到的东西，以及正在发生的生活。"
    />

    <nav class="year-index" aria-label="时间线年份">
      <a v-for="entry in entries" :key="entry.id" :href="`#timeline-${entry.id}`">
        {{ entry.dateLabel }}
      </a>
    </nav>

    <div class="timeline">
      <article
        v-for="(entry, index) in entries"
        :id="`timeline-${entry.id}`"
        :key="entry.id"
        class="timeline-chapter"
        :class="{ 'timeline-chapter--now': index === entries.length - 1 }"
      >
        <div class="timeline-year">
          <span>{{ entry.datePrecision }}</span>
          <strong>{{ entry.dateLabel }}</strong>
        </div>
        <div class="timeline-node"><i />{{ String(index + 1).padStart(2, '0') }}</div>
        <div class="story-card">
          <p>JOV3 / {{ entry.dateLabel }}</p>
          <h2>{{ entry.title }}</h2>
          <div class="timeline-body" v-html="entry.bodyHtml" />
          <div v-if="entry.media.length" class="timeline-media" aria-label="Timeline images">
            <img
              v-for="media in entry.media"
              :key="media.id"
              :src="media.publicUrl"
              :alt="media.altText || entry.title"
              loading="lazy"
            />
          </div>
          <div v-if="entry.links.length || entry.projects.length" class="timeline-relations">
            <a
              v-for="link in entry.links"
              :key="link.url"
              :href="link.url"
              target="_blank"
              rel="noreferrer"
            >
              {{ link.label }} ↗
            </a>
            <NuxtLink
              v-for="project in entry.projects"
              :key="project.id"
              :to="`/projects/${project.slug}`"
            >
              {{ project.name }} →
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
