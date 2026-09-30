<script setup lang="ts">
const admin = useAdminSession();
const isSigningOut = ref(false);

const futureNavigation = [
  { group: '内容', items: ['Posts', 'Categories', 'Projects', 'Timeline'] },
  { group: '资料', items: ['Homepage', 'CV', 'Social Links'] },
  { group: '互动', items: ['Comments', 'Messages', 'Friend Links'] },
  { group: '足迹', items: ['Footprint'] },
  { group: '系统', items: ['Media', 'Site Settings'] },
];

const adminLabels: Record<string, string> = {
  Posts: '文章',
  Categories: '分类',
  Projects: '项目',
  Timeline: '时间线',
  Homepage: '首页',
  CV: '简历',
  'Social Links': '社交链接',
  Comments: '评论',
  Messages: '留言',
  'Friend Links': '友链',
  Footprint: '足迹',
  Media: '媒体库',
  'Site Settings': '站点设置',
};

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
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <NuxtLink class="admin-wordmark" to="/admin">JOV3<span>.</span><small>ADMIN</small></NuxtLink>
      <nav aria-label="后台导航">
        <NuxtLink class="admin-nav-link" to="/admin"><i>⌂</i> 仪表盘</NuxtLink>
        <section v-for="section in futureNavigation" :key="section.group">
          <p>{{ section.group }}</p>
          <template v-for="item in section.items" :key="item">
            <NuxtLink v-if="item === 'Media'" class="admin-nav-link" to="/admin/media">
              <i>·</i> {{ adminLabels[item] }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Homepage'" class="admin-nav-link" to="/admin/home">
              <i>·</i> {{ adminLabels[item] }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Projects'" class="admin-nav-link" to="/admin/projects">
              <i>·</i> {{ adminLabels[item] }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Timeline'" class="admin-nav-link" to="/admin/timeline">
              <i>·</i> {{ adminLabels[item] }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Posts'" class="admin-nav-link" to="/admin/posts">
              <i>·</i> {{ adminLabels[item] }}
            </NuxtLink>
            <NuxtLink
              v-else-if="item === 'Categories'"
              class="admin-nav-link"
              to="/admin/categories"
            >
              <i>·</i> {{ adminLabels[item] }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Comments'" class="admin-nav-link" to="/admin/comments">
              <i>·</i> {{ adminLabels[item] }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Messages'" class="admin-nav-link" to="/admin/messages">
              <i>·</i> {{ adminLabels[item] }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Friend Links'" class="admin-nav-link" to="/admin/links">
              <i>·</i> {{ adminLabels[item] }}
            </NuxtLink>
            <NuxtLink
              v-else-if="item === 'Social Links'"
              class="admin-nav-link"
              to="/admin/home#social-links"
            >
              <i>·</i> {{ adminLabels[item] }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'CV'" class="admin-nav-link" to="/admin/cv">
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Footprint'" class="admin-nav-link" to="/admin/footprint">
              <i>·</i> {{ item }}
            </NuxtLink>
            <span v-else class="admin-nav-link admin-nav-link--disabled">
              <i>·</i> {{ adminLabels[item] }}<small>暂未开放</small>
            </span>
          </template>
        </section>
      </nav>
      <div class="admin-identity">
        <span>{{ admin?.displayName.slice(0, 2).toUpperCase() }}</span>
        <div>
          <strong>{{ admin?.displayName }}</strong
          ><small>{{ admin?.email }}</small>
        </div>
      </div>
    </aside>

    <div class="admin-workspace">
      <header class="admin-topbar">
        <span>内容工作台</span>
        <div>
          <NuxtLink to="/" target="_blank">查看站点 ↗</NuxtLink>
          <button type="button" :disabled="isSigningOut" @click="signOut">退出登录</button>
        </div>
      </header>
      <main class="admin-main"><slot /></main>
    </div>
  </div>
</template>

<style src="~/assets/css/admin.css"></style>
