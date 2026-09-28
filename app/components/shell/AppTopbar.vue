<script setup lang="ts">
import MainNav from './MainNav.vue';
</script>

<template>
  <header class="topbar">
    <div class="topbar__inner">
      <NuxtLink class="wordmark" to="/" aria-label="JOV3 首页">JOV3<span>.</span></NuxtLink>
      <MainNav />
    </div>
  </header>
</template>
