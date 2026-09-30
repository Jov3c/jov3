<script setup lang="ts">
import AppFooter from '~/components/shell/AppFooter.vue';
import AppTopbar from '~/components/shell/AppTopbar.vue';
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <AppTopbar />
    <main id="main-content" class="site-main">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<style src="~/assets/css/public.css"></style>
