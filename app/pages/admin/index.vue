<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });

const admin = useAdminSession();
const { data: statsResponse } = await useFetch<{
  data: { totalPageViews: number; onlineVisitors: number };
}>('/api/v1/public/site/stats', { key: 'admin-site-stats' });
const overview = computed(() => [
  { label: 'Published posts', value: '—', note: 'Manage in Posts' },
  { label: 'Projects', value: '—', note: 'Manage in Projects' },
  { label: 'Pending reviews', value: '—', note: 'Review in Comments / Messages' },
  {
    label: 'Site visits',
    value: statsResponse.value?.data.totalPageViews.toLocaleString('zh-CN') ?? '—',
    note: `${statsResponse.value?.data.onlineVisitors ?? '—'} online now`,
  },
]);

useSeoMeta({ title: 'Dashboard — Jov3 Admin', robots: 'noindex, nofollow' });
</script>

<template>
  <div class="admin-dashboard">
    <header class="admin-page-heading">
      <div>
        <p>Overview</p>
        <h1>Dashboard</h1>
      </div>
      <span>Signed in as {{ admin?.email }}</span>
    </header>

    <section class="admin-welcome">
      <div>
        <p class="eyebrow">Foundation ready</p>
        <h2>你好，{{ admin?.displayName }}。</h2>
      </div>
      <p>
        安全登录与后台骨架已经就绪。各内容模块会按开发阶段逐步接入，不在这里展示虚假的统计数据。
      </p>
    </section>

    <div class="admin-overview-grid">
      <article v-for="item in overview" :key="item.label">
        <span>{{ item.label }}</span
        ><strong>{{ item.value }}</strong
        ><small>{{ item.note }}</small>
      </article>
    </div>

    <section class="admin-next-step">
      <span>Next stage</span>
      <div>
        <h2>Real data migration & full QA</h2>
        <p>全站基础能力已经接入，下一阶段将删除开发期 fixture 并进行全量功能、视觉与安全验收。</p>
      </div>
      <b>12</b>
    </section>
  </div>
</template>
