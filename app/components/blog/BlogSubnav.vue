<script setup lang="ts">
import { blogNavigation } from '~/data/navigation';
</script>

<template>
  <nav class="blog-subnav" aria-label="博客导航">
    <NuxtLink v-for="item in blogNavigation" :key="item.to" :to="item.to">
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
