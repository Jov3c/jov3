<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });

const admin = useAdminSession();
const overview = [
  { label: 'Published posts', value: '—', note: 'Available in Stage 06' },
  { label: 'Projects', value: '—', note: 'Available in Stage 05' },
  { label: 'Pending reviews', value: '—', note: 'Available in Stage 08' },
  { label: 'Site visits', value: '—', note: 'Available in Stage 11' },
];

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
        <h2>Home & site configuration</h2>
        <p>媒体库和邮箱验证基础已经就绪，下一步接入首页配置的数据闭环。</p>
      </div>
      <b>04</b>
    </section>
  </div>
</template>
