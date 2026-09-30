<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import ErrorState from '~/components/ui/ErrorState.vue';
import StandardHero from '~/components/ui/StandardHero.vue';
import type { PublicArchiveResponse } from '~/types/blog';

usePageSeo({ title: 'Archive — Blog — Jov3', description: '按时间查看 Jov3 的全部文章。' });
definePageMeta({ layout: 'blog-prototype' });
const { data, pending, error, refresh } =
  await useFetch<PublicArchiveResponse>('/api/v1/public/archive');
</script>

<template>
  <BlogChrome>
    <template #hero>
      <StandardHero
        eyebrow="TIMELINE"
        title="Archive"
        description="按时间回看我写过的文章。这里只保留最简单的时间线，不再增加额外筛选。"
      />
    </template>
    <div v-if="pending" class="state-panel"><h2>正在整理归档…</h2></div>
    <ErrorState v-else-if="error" title="归档暂时无法加载" description="请稍后再试。">
      <button class="button button--ghost" type="button" @click="refresh()">重新加载</button>
    </ErrorState>
    <div v-else-if="data?.data.years.length === 0" class="state-panel">
      <h2>还没有已发布的文章。</h2>
    </div>
    <div v-else class="archive-card">
      <div class="archive-summary">
        <div>
          <strong>{{ data?.data.total ?? 0 }}</strong
          ><span> 篇文章</span>
        </div>
        <div>
          <strong>{{ data?.data.years.length ?? 0 }}</strong
          ><span> 个年份</span>
        </div>
      </div>
      <div class="archive-list">
        <section v-for="group in data?.data.years" :key="group.year" class="archive-year">
          <div class="archive-year__heading">
            <h2>{{ group.year }}</h2>
            <span>{{ group.articleCount }} 篇文章</span>
          </div>
          <div v-for="month in group.months" :key="month.month" class="archive-group">
            <h3>{{ month.month }}月</h3>
            <ul>
              <li v-for="item in month.items" :key="item.id">
                <time :datetime="item.publishedAt">{{ item.publishedAt.slice(5, 10) }}</time>
                <NuxtLink :to="`/blog/${item.slug}`">{{ item.title }}</NuxtLink>
                <small>{{ item.category }}</small>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </BlogChrome>
</template>
