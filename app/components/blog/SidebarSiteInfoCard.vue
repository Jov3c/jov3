<script setup lang="ts">
import type { BlogCategory } from '~/types/blog';
import type { PublicSiteStats } from '~/types/stats';

const props = defineProps<{
  categories: BlogCategory[];
  stats?: PublicSiteStats;
}>();

function formatViews(value: number | undefined) {
  return value === undefined ? '—' : value.toLocaleString('zh-CN');
}
</script>

<template>
  <section>
    <p class="sidebar-label">CATEGORIES</p>
    <ul class="sidebar-list">
      <li v-for="category in categories" :key="category.id">
        <span>{{ category.name }}</span>
        <b>{{ category.postCount }}</b>
      </li>
    </ul>
  </section>
  <section class="site-info-card">
    <h4 class="site-info-title">网站信息</h4>
    <div class="site-info-list">
      <p class="site-info-row">
        <span>在线人数</span
        ><b class="site-info-value online">{{ props.stats?.onlineVisitors ?? '—' }}</b>
      </p>
      <p class="site-info-row">
        <span>总浏览量</span
        ><b class="site-info-value">{{ formatViews(props.stats?.totalPageViews) }}</b>
      </p>
      <p class="site-info-row">
        <span>已运行</span><b class="site-info-value">{{ props.stats?.uptime.label ?? '—' }}</b>
      </p>
      <p class="site-info-row">
        <span>建站时间</span><b class="site-info-value">{{ props.stats?.foundedAt ?? '—' }}</b>
      </p>
    </div>
  </section>
</template>
