<script setup lang="ts">
withDefaults(
  defineProps<{
    as?: string;
    interactive?: boolean;
  }>(),
  { as: 'section', interactive: false },
);
</script>

<template>
  <component :is="as" class="surface-card" :class="{ 'surface-card--interactive': interactive }">
    <slot />
  </component>
</template>
