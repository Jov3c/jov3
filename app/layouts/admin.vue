<script setup lang="ts">
const admin = useAdminSession();
const route = useRoute();
const isSigningOut = ref(false);
const isCollapsed = ref(false);
const isMobileOpen = ref(false);

const navigation = [
  {
    label: '内容管理',
    items: [
      { label: '文章管理', to: '/admin/posts', icon: '文' },
      { label: '分类管理', to: '/admin/categories', icon: '类' },
      { label: '项目管理', to: '/admin/projects', icon: '项' },
      { label: '时间线', to: '/admin/timeline', icon: '时' },
    ],
  },
  {
    label: '资料管理',
    items: [
      { label: '首页资料', to: '/admin/home', icon: '首' },
      { label: '个人简历', to: '/admin/cv', icon: '历' },
    ],
  },
  {
    label: '互动管理',
    items: [
      { label: '评论管理', to: '/admin/comments', icon: '评' },
      { label: '留言管理', to: '/admin/messages', icon: '留' },
      { label: '友链管理', to: '/admin/links', icon: '链' },
    ],
  },
  {
    label: '系统管理',
    items: [
      { label: '媒体库', to: '/admin/media', icon: '媒' },
      { label: '足迹数据', to: '/admin/footprint', icon: '迹' },
    ],
  },
];

const currentPage = computed(() => {
  if (route.path === '/admin') return '仪表盘';
  return (
    navigation.flatMap((section) => section.items).find((item) => route.path.startsWith(item.to))
      ?.label ?? '后台管理'
  );
});

watch(
  () => route.path,
  () => (isMobileOpen.value = false),
);

onMounted(() => {
  isCollapsed.value = localStorage.getItem('admin-sidebar-collapsed') === 'true';
});

function toggleCollapsed() {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('admin-sidebar-collapsed', String(isCollapsed.value));
}

async function signOut() {
  isSigningOut.value = true;
  try {
    await $fetch('/api/v1/auth/logout', { method: 'POST' });
    admin.value = null;
    window.location.assign('/admin/login');
  } finally {
    isSigningOut.value = false;
  }
}
</script>

<template>
  <div
    class="admin-layout"
    :class="{
      'admin-layout--collapsed': isCollapsed,
      'admin-layout--mobile-open': isMobileOpen,
    }"
  >
    <button
      v-if="isMobileOpen"
      class="admin-sidebar-backdrop"
      type="button"
      aria-label="关闭导航"
      @click="isMobileOpen = false"
    />
    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand-row">
        <NuxtLink class="admin-wordmark" to="/admin" aria-label="JOV3 后台首页">
          <span class="admin-wordmark__mark">J3</span>
          <span class="admin-wordmark__text">JOV3 管理后台</span>
        </NuxtLink>
        <button
          class="admin-sidebar__mobile-close"
          type="button"
          aria-label="关闭导航"
          @click="isMobileOpen = false"
        >
          ×
        </button>
      </div>

      <nav aria-label="后台导航">
        <NuxtLink class="admin-nav-link" to="/admin"> <i>览</i><span>仪表盘</span> </NuxtLink>
        <section v-for="section in navigation" :key="section.label">
          <p>{{ section.label }}</p>
          <NuxtLink
            v-for="item in section.items"
            :key="item.to"
            class="admin-nav-link"
            :to="item.to"
          >
            <i>{{ item.icon }}</i
            ><span>{{ item.label }}</span>
          </NuxtLink>
        </section>
      </nav>

      <div class="admin-identity">
        <span>{{ admin?.displayName.slice(0, 2).toUpperCase() }}</span>
        <div>
          <strong>{{ admin?.displayName }}</strong>
          <small>{{ admin?.email }}</small>
        </div>
      </div>
    </aside>

    <div class="admin-workspace">
      <header class="admin-topbar">
        <div class="admin-topbar__leading">
          <button
            class="admin-mobile-menu"
            type="button"
            aria-label="打开导航"
            @click="isMobileOpen = true"
          >
            ☰
          </button>
          <button
            class="admin-collapse-button"
            type="button"
            :aria-label="isCollapsed ? '展开侧栏' : '收起侧栏'"
            @click="toggleCollapsed"
          >
            {{ isCollapsed ? '›' : '‹' }}
          </button>
          <nav class="admin-breadcrumb" aria-label="面包屑">
            <NuxtLink to="/admin">管理后台</NuxtLink><span>/</span
            ><strong>{{ currentPage }}</strong>
          </nav>
        </div>
        <div class="admin-topbar__actions">
          <NuxtLink to="/" target="_blank">查看站点 ↗</NuxtLink>
          <span class="admin-topbar__user">{{ admin?.displayName }}</span>
          <button type="button" :disabled="isSigningOut" @click="signOut">
            {{ isSigningOut ? '正在退出…' : '退出登录' }}
          </button>
        </div>
      </header>
      <main class="admin-main"><slot /></main>
    </div>
  </div>
</template>

<style src="~/assets/css/admin.css"></style>
<style src="~/assets/css/admin-shell.css"></style>
