<script setup lang="ts">
import AboutDropdown from '~/components/shell/AboutDropdown.vue';
import { primaryNavigation } from '~/data/navigation';
</script>

<template>
  <div class="blog-prototype-shell">
    <header class="blog-prototype-topbar">
      <div class="blog-prototype-topbar__inner">
        <NuxtLink class="blog-prototype-brand" to="/" aria-label="JOV3 首页">
          <i aria-hidden="true" />
          JOV3
        </NuxtLink>
        <nav class="blog-prototype-nav" aria-label="主导航">
          <NuxtLink v-for="item in primaryNavigation" :key="item.to" :to="item.to">
            {{ item.label }}
          </NuxtLink>
          <AboutDropdown />
        </nav>
      </div>
    </header>
    <main id="main-content"><slot /></main>
  </div>
</template>

<style src="~/assets/css/prototype.css"></style>
