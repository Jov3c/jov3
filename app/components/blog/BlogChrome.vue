<script setup lang="ts">
import BlogSidebar from './BlogSidebar.vue';
import BlogSubnav from './BlogSubnav.vue';
</script>

<template>
  <div class="page-container blog-page">
    <BlogSubnav />
    <div class="blog-layout">
      <div class="blog-main"><slot /></div>
      <BlogSidebar />
    </div>
  </div>
</template>
