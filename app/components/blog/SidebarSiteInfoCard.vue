<script setup lang="ts">
import { blogPosts } from '~/data/content';

const categories = [...new Set(blogPosts.map((post) => post.category))];
</script>

<template>
  <section>
    <p class="sidebar-label">CATEGORIES</p>
    <ul class="sidebar-list">
      <li v-for="category in categories" :key="category">
        <span>{{ category }}</span>
        <b>{{ blogPosts.filter((post) => post.category === category).length }}</b>
      </li>
    </ul>
  </section>
  <section class="site-facts">
    <p>
      <span>文章</span><b>{{ blogPosts.length }}</b>
    </p>
    <p><span>始于</span><b>2026-01-01</b></p>
  </section>
</template>
