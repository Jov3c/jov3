<script setup lang="ts">
import { primaryNavigation } from '~/data/navigation';
import AboutDropdown from './AboutDropdown.vue';
</script>

<template>
  <nav class="main-nav" aria-label="主导航">
    <NuxtLink
      v-for="item in primaryNavigation"
      :key="item.to"
      class="nav-link"
      :to="item.to"
      :aria-label="`${item.label} 页面`"
    >
      {{ item.label }}
    </NuxtLink>
    <AboutDropdown />
  </nav>
</template>
