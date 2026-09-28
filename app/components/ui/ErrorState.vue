<script setup lang="ts">
defineProps<{ code?: number; title: string; description: string; label?: string }>();
</script>

<template>
  <section class="error-state">
    <div class="error-code">{{ code }}</div>
    <p class="eyebrow">{{ label ?? 'Something went wrong' }}</p>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
    <slot />
  </section>
</template>
