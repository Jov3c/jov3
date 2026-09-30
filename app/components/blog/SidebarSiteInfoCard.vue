<script setup lang="ts">
import type { PublicSiteStats } from '~/types/stats';

const props = defineProps<{
  stats?: PublicSiteStats;
}>();
</script>

<template>
  <section class="site-info-card">
    <h4 class="site-info-title">网站信息</h4>
    <div class="site-info-list">
      <p class="site-info-row"><span>在线人数</span><b class="site-info-value online">3</b></p>
      <p class="site-info-row"><span>总浏览量</span><b class="site-info-value">12,864</b></p>
      <p class="site-info-row">
        <span>已运行</span><b class="site-info-value">{{ props.stats?.uptime.label ?? '—' }}</b>
      </p>
      <p class="site-info-row"><span>建站时间</span><b class="site-info-value">2026-01-01</b></p>
    </div>
  </section>
</template>
