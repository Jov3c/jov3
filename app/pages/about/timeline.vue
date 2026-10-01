<script setup lang="ts">
import type { PublicTimelineResponse } from '~/types/timeline';

definePageMeta({ layout: 'blog-prototype' });

const { data, error } = await useFetch<PublicTimelineResponse>('/api/v1/public/timeline', {
  key: 'public-timeline',
});

if (!data.value) {
  throw createError({
    statusCode: error.value?.statusCode || 503,
    statusMessage: '时间线暂时无法访问',
  });
}

const entries = computed(() => data.value!.data);
const timelineRoot = ref<HTMLElement | null>(null);
const activeIndex = ref(0);
const railProgress = ref(0);
let revealObserver: IntersectionObserver | null = null;

function chapterLabel(entry: PublicTimelineResponse['data'][number], index: number) {
  return index === entries.value.length - 1 ? 'CONTINUE' : entry.dateLabel;
}

function chapterKicker(entry: PublicTimelineResponse['data'][number]) {
  if (entry.projects.length) return entry.projects.map((project) => project.name).join(' · ');
  if (entry.links.length) return 'LINKS';
  return entry.datePrecision;
}

function chapterTag(entry: PublicTimelineResponse['data'][number]) {
  if (entry.projects.length) return 'PROJECT';
  if (entry.links.length) return 'LINK';
  return 'LIFE / BUILD';
}

function yearOf(value: string) {
  return value.slice(0, 4);
}

function updateTimeline() {
  if (!timelineRoot.value) return;
  const chapters = [...timelineRoot.value.querySelectorAll<HTMLElement>('.life-chapter')];
  const viewportPoint = window.innerHeight * 0.42;
  let nearest = Number.POSITIVE_INFINITY;
  chapters.forEach((chapter, index) => {
    const distance = Math.abs(chapter.getBoundingClientRect().top + 22 - viewportPoint);
    if (distance < nearest) {
      nearest = distance;
      activeIndex.value = index;
    }
  });
  const rect = timelineRoot.value.getBoundingClientRect();
  railProgress.value = Math.max(
    0,
    Math.min(100, ((window.innerHeight * 0.42 - rect.top) / rect.height) * 100),
  );
}

onMounted(() => {
  if (!timelineRoot.value) return;
  revealObserver = new IntersectionObserver(
    (observed) =>
      observed.forEach((item) => item.isIntersecting && item.target.classList.add('is-visible')),
    { threshold: 0.18, rootMargin: '0px 0px -18% 0px' },
  );
  timelineRoot.value
    .querySelectorAll('.life-chapter')
    .forEach((chapter) => revealObserver?.observe(chapter));
  window.addEventListener('scroll', updateTimeline, { passive: true });
  updateTimeline();
});

onBeforeUnmount(() => {
  revealObserver?.disconnect();
  window.removeEventListener('scroll', updateTimeline);
});

usePageSeo({
  title: 'Life Timeline — About — Jov3',
  description: '做过的项目、改变方向的时刻、学到的东西，以及正在发生的生活。',
});
</script>

<template>
  <div class="page-container life-page">
    <section class="life-hero">
      <div>
        <p class="eyebrow">Life timeline</p>
        <h1>A story still being written.</h1>
        <p>
          不是简历，也不是履历表。只是把一些值得记住的节点留下来：做过的项目、改变方向的时刻、学到的东西，以及正在发生的生活。
        </p>
        <div class="life-scroll-hint"><span /><em>Scroll to continue</em></div>
      </div>
    </section>

    <section ref="timelineRoot" class="life-timeline-wrap">
      <div class="life-current-year">
        CURRENT<strong>{{
          entries[activeIndex] ? yearOf(entries[activeIndex]!.dateLabel) : '2023'
        }}</strong>
      </div>
      <div class="life-rail"><i /><b :style="{ height: `${railProgress}%` }" /></div>
      <div class="life-timeline">
        <article
          v-for="(entry, index) in entries"
          :key="entry.id"
          class="life-chapter"
          :class="{
            'is-active': index === activeIndex,
            'is-past': index < activeIndex,
            'life-chapter--now': index === entries.length - 1,
          }"
        >
          <div class="life-chapter__year">
            {{ chapterLabel(entry, index)
            }}<strong>{{ index === entries.length - 1 ? 'NOW' : yearOf(entry.dateLabel) }}</strong>
          </div>
          <div class="life-chapter__node"><span /></div>
          <div class="life-chapter__content">
            <div class="life-chapter__kicker">{{ chapterKicker(entry) }}</div>
            <h2>{{ entry.title }}</h2>
            <!-- Timeline HTML is rendered and sanitized by the shared server Markdown pipeline. -->
            <!-- eslint-disable vue/no-v-html -->
            <div
              v-if="index < entries.length - 1"
              class="life-chapter__description"
              v-html="entry.bodyHtml"
            />
            <!-- eslint-enable vue/no-v-html -->
            <div v-if="index < entries.length - 1" class="life-story-card">
              <div class="life-story-card__meta">
                <span>{{ chapterTag(entry) }}</span
                ><span>{{ entry.dateLabel }}</span>
              </div>
              <div
                v-if="entry.media.length"
                class="life-story-card__media"
                :class="{ 'life-story-card__media--multiple': entry.media.length > 1 }"
              >
                <figure v-for="media in entry.media" :key="media.id">
                  <img :src="media.publicUrl" :alt="media.altText || entry.title" loading="lazy" />
                </figure>
              </div>
              <div
                v-if="entry.links.length || entry.projects.length"
                class="life-story-card__references"
              >
                <a
                  v-for="link in entry.links"
                  :key="`${entry.id}-${link.url}`"
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
            <div v-else class="life-now-card">
              <strong>{{ entry.title }}</strong
              ><span>{{ entry.dateLabel }}</span>
              <!-- Timeline HTML is rendered and sanitized by the shared server Markdown pipeline. -->
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="life-now-card__body" v-html="entry.bodyHtml" />
            </div>
          </div>
        </article>
      </div>
    </section>

    <footer class="life-footer"><span>JOV3</span><span>Life timeline · 2026</span></footer>
  </div>
</template>
