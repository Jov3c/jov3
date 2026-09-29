<script setup lang="ts">
import { blogNavigation } from '~/data/navigation';
</script>

<template>
  <div class="blog-subnav">
    <nav aria-label="博客导航">
      <NuxtLink v-for="item in blogNavigation" :key="item.to" :to="item.to">
        {{ item.label }}
      </NuxtLink>
    </nav>
    <slot />
  </div>
</template>
