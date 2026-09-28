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
    await navigateTo('/admin/login');
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
          <span
            v-for="item in section.items"
            :key="item"
            class="admin-nav-link admin-nav-link--disabled"
          >
            <i>·</i> {{ item }}<small>Later</small>
          </span>
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
