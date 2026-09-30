<script setup lang="ts">
import BlogSidebar from './BlogSidebar.vue';
import BlogSubnav from './BlogSubnav.vue';

withDefaults(
  defineProps<{
    showSidebar?: boolean;
    showSubnav?: boolean;
  }>(),
  { showSidebar: true, showSubnav: true },
);
</script>

<template>
  <div class="page-container blog-page">
    <slot name="hero" />
    <div v-if="showSubnav" class="blog-subnav-grid">
      <BlogSubnav><slot name="category" /></BlogSubnav>
      <div v-if="showSidebar" class="blog-subnav-spacer" aria-hidden="true" />
    </div>
    <div class="blog-content-grid" :class="{ 'blog-content-grid--wide': !showSidebar }">
      <div class="blog-main"><slot /></div>
      <BlogSidebar v-if="showSidebar" />
    </div>
  </div>
</template>
