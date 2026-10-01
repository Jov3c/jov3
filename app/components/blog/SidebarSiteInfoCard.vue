<script setup lang="ts">
import type { PublicSiteStats } from '~/types/stats';

const props = defineProps<{
  stats?: PublicSiteStats;
}>();

function formatNumber(value: number | undefined) {
  return value === undefined ? '—' : new Intl.NumberFormat('en-US').format(value);
}
</script>

<template>
  <section class="site-info-card">
    <h4 class="site-info-title">网站信息</h4>
    <div class="site-info-list">
      <p class="site-info-row">
        <span>在线人数</span>
        <b class="site-info-value online">{{ props.stats?.onlineVisitors ?? '—' }}</b>
      </p>
      <p class="site-info-row">
        <span>总浏览量</span>
        <b class="site-info-value">{{ formatNumber(props.stats?.totalPageViews) }}</b>
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
