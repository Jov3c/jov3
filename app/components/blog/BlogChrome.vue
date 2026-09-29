<script setup lang="ts">
import BlogSidebar from './BlogSidebar.vue';
import BlogSubnav from './BlogSubnav.vue';
</script>

<template>
  <div class="page-container blog-page">
    <div class="blog-layout">
      <div class="blog-main">
        <slot name="hero" />
        <BlogSubnav><slot name="category" /></BlogSubnav>
        <slot />
      </div>
      <BlogSidebar />
    </div>
  </div>
</template>
