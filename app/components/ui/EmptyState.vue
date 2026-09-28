<script setup lang="ts">
defineProps<{ title: string; description: string }>();
</script>

<template>
  <section class="state-panel">
    <p class="eyebrow">Nothing here yet</p>
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <slot />
  </section>
</template>
