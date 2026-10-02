<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' });

const admin = useAdminSession();
const { data: statsResponse, pending } = await useFetch<{
  data: { totalPageViews: number; onlineVisitors: number };
}>('/api/v1/public/site/stats', { key: 'admin-site-stats' });

const overview = computed(() => [
  {
    label: '累计访问量',
    value: statsResponse.value?.data.totalPageViews.toLocaleString('zh-CN') ?? '—',
    note: '全站页面访问次数',
  },
  {
    label: '当前在线',
    value: statsResponse.value?.data.onlineVisitors.toLocaleString('zh-CN') ?? '—',
    note: '最近五分钟活跃访客',
  },
]);

const shortcuts = [
  { title: '文章管理', description: '撰写、发布和维护博客文章', to: '/admin/posts', icon: '文' },
  { title: '项目管理', description: '维护项目展示和项目详情', to: '/admin/projects', icon: '项' },
  { title: '互动管理', description: '处理评论、留言和友链', to: '/admin/comments', icon: '评' },
  { title: '首页资料', description: '更新身份信息和首页入口', to: '/admin/home', icon: '首' },
];

useSeoMeta({ title: '仪表盘 — JOV3 管理后台', robots: 'noindex, nofollow' });
</script>

<template>
  <div class="admin-dashboard">
    <header class="admin-page-heading">
      <div>
        <p>管理概览</p>
        <h1>仪表盘</h1>
      </div>
      <span>{{ admin?.email }}</span>
    </header>

    <section class="admin-welcome">
      <div>
        <p>欢迎回来</p>
        <h2>{{ admin?.displayName }}，今天也继续记录吧。</h2>
      </div>
      <NuxtLink to="/" target="_blank">查看公开站点 ↗</NuxtLink>
    </section>

    <section class="admin-dashboard-section" aria-labelledby="site-data-heading">
      <div class="admin-section-heading">
        <div>
          <p>实时数据</p>
          <h2 id="site-data-heading">网站概览</h2>
        </div>
        <span>{{ pending ? '正在更新…' : '数据已同步' }}</span>
      </div>
      <div class="admin-overview-grid">
        <article v-for="item in overview" :key="item.label">
          <span>{{ item.label }}</span
          ><strong>{{ item.value }}</strong
          ><small>{{ item.note }}</small>
        </article>
      </div>
    </section>

    <section class="admin-dashboard-section" aria-labelledby="shortcuts-heading">
      <div class="admin-section-heading">
        <div>
          <p>常用功能</p>
          <h2 id="shortcuts-heading">快捷入口</h2>
        </div>
      </div>
      <div class="admin-shortcut-grid">
        <NuxtLink
          v-for="item in shortcuts"
          :key="item.to"
          :to="item.to"
          class="admin-shortcut-card"
        >
          <i>{{ item.icon }}</i
          ><span
            ><strong>{{ item.title }}</strong
            ><small>{{ item.description }}</small></span
          ><b>›</b>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
