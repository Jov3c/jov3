<script setup lang="ts">
withDefaults(defineProps<{ height?: string; label?: string }>(), {
  height: '1rem',
  label: '内容加载中',
});
</script>

<template>
  <span class="skeleton-block" :style="{ height }" role="status" :aria-label="label" />
</template>
