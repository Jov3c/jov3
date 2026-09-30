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

const chapterCopy = [
  {
    label: 'START',
    kicker: 'Beginning',
    heading: '开始认真把想法做出来。',
    description: '从“想做一个东西”到真正开始拆需求、画页面、写代码，这大概是很多事情的起点。',
    tag: 'LIFE / BUILD',
  },
  {
    label: 'EXPLORE',
    kicker: 'Exploration',
    heading: '开始在产品和技术之间来回走。',
    description: '不再只是关注“能不能做”，而是开始在意为什么这样设计、用户会怎么用、以后怎么维护。',
    tag: 'PRODUCT',
  },
  {
    label: 'BUILD',
    kicker: 'Independent projects',
    heading: '开始做更多真正属于自己的东西。',
    description:
      '一些项目被留下，一些项目被废弃。它们慢慢变成一种判断：什么值得继续，什么应该及时停下来。',
    tag: 'PROJECT',
  },
  {
    label: 'NOW',
    kicker: 'AI · Product · Developer',
    heading: '把 AI、产品和开发放到同一件事里。',
    description: '现在更关心的是：能不能把一个想法做成真正有人愿意持续使用的东西。',
    tag: 'PROJECT',
  },
  {
    label: 'CONTINUE',
    kicker: 'To be continued',
    heading: '故事仍在继续。',
    description: '后面的事情还没有发生，所以这里不需要写满。',
    tag: 'CONTINUE BUILDING',
  },
];

function chapterFor(entry: PublicTimelineResponse['data'][number], index: number) {
  return (
    chapterCopy[index] ?? {
      label: 'CHAPTER',
      kicker: entry.title,
      heading: entry.title,
      description: `记录于 ${entry.dateLabel}。`,
      tag: 'LIFE / BUILD',
    }
  );
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
            {{ chapterFor(entry, index).label
            }}<strong>{{ index === entries.length - 1 ? 'NOW' : yearOf(entry.dateLabel) }}</strong>
          </div>
          <div class="life-chapter__node"><span /></div>
          <div class="life-chapter__content">
            <div class="life-chapter__kicker">{{ chapterFor(entry, index).kicker }}</div>
            <h2>{{ chapterFor(entry, index).heading }}</h2>
            <p class="life-chapter__description">{{ chapterFor(entry, index).description }}</p>
            <div v-if="index < entries.length - 1" class="life-story-card">
              <div class="life-story-card__meta">
                <span>{{ chapterFor(entry, index).tag }}</span
                ><span>{{ yearOf(entry.dateLabel) }}</span>
              </div>
              <h3>{{ entry.title }}</h3>
              <!-- Timeline HTML is rendered and sanitized by the shared server Markdown pipeline. -->
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="life-story-card__text" v-html="entry.bodyHtml" />
              <div v-if="index === 2" class="life-story-card__image" />
            </div>
            <div v-else class="life-now-card">
              <strong>继续构建。</strong
              ><span>{{ entry.title }} 下一段轨迹，等它真的发生以后再写。</span>
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
