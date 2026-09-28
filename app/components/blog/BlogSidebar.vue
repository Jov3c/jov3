<script setup lang="ts">
import { blogPosts } from '~/data/content';

const categories = computed(() => [...new Set(blogPosts.map((post) => post.category))]);
</script>

<template>
  <aside class="blog-sidebar" aria-label="博客信息">
    <section class="author-card">
      <div class="author-card__avatar">J3</div>
      <div>
        <strong>Jov3</strong>
        <p>Product · AI · Developer</p>
      </div>
    </section>
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
  </aside>
</template>
