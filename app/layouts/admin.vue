<script setup lang="ts">
const admin = useAdminSession();
const isSigningOut = ref(false);

const futureNavigation = [
  { group: 'Content', items: ['Posts', 'Categories', 'Projects', 'Timeline'] },
  { group: 'Profile', items: ['Homepage', 'CV', 'Social Links'] },
  { group: 'Community', items: ['Comments', 'Messages', 'Friend Links'] },
  { group: 'Places', items: ['Footprint'] },
  { group: 'System', items: ['Media', 'Site Settings'] },
];

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
        <NuxtLink class="admin-nav-link" to="/admin"><i>⌂</i> Dashboard</NuxtLink>
        <section v-for="section in futureNavigation" :key="section.group">
          <p>{{ section.group }}</p>
          <template v-for="item in section.items" :key="item">
            <NuxtLink v-if="item === 'Media'" class="admin-nav-link" to="/admin/media">
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Homepage'" class="admin-nav-link" to="/admin/home">
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Projects'" class="admin-nav-link" to="/admin/projects">
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Timeline'" class="admin-nav-link" to="/admin/timeline">
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Posts'" class="admin-nav-link" to="/admin/posts">
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink
              v-else-if="item === 'Categories'"
              class="admin-nav-link"
              to="/admin/categories"
            >
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Comments'" class="admin-nav-link" to="/admin/comments">
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Messages'" class="admin-nav-link" to="/admin/messages">
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Friend Links'" class="admin-nav-link" to="/admin/links">
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink
              v-else-if="item === 'Social Links'"
              class="admin-nav-link"
              to="/admin/home#social-links"
            >
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'CV'" class="admin-nav-link" to="/admin/cv">
              <i>·</i> {{ item }}
            </NuxtLink>
            <NuxtLink v-else-if="item === 'Footprint'" class="admin-nav-link" to="/admin/footprint">
              <i>·</i> {{ item }}
            </NuxtLink>
            <span v-else class="admin-nav-link admin-nav-link--disabled">
              <i>·</i> {{ item }}<small>Later</small>
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
        <span>Content workspace</span>
        <div>
          <NuxtLink to="/" target="_blank">View site ↗</NuxtLink>
          <button type="button" :disabled="isSigningOut" @click="signOut">Sign out</button>
        </div>
      </header>
      <main class="admin-main"><slot /></main>
    </div>
  </div>
</template>
