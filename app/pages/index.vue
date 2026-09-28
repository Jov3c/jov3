<script setup lang="ts">
import { PROJECT_NAME } from '#shared/constants/project';

useHead({
  title: `${PROJECT_NAME} — Bootstrap ready`,
});
</script>

<template>
  <main class="bootstrap-shell">
    <section class="bootstrap-card" aria-labelledby="bootstrap-title">
      <p class="bootstrap-eyebrow">Stage 00</p>
      <h1 id="bootstrap-title">{{ PROJECT_NAME }}</h1>
      <p>Bootstrap ready</p>
    </section>
  </main>
</template>
