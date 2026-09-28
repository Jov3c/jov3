<script setup lang="ts">
withDefaults(
  defineProps<{
    to?: string;
    href?: string;
    variant?: 'solid' | 'ghost';
  }>(),
  { to: undefined, href: undefined, variant: 'solid' },
);
</script>

<template>
  <NuxtLink v-if="to" class="button" :class="`button--${variant}`" :to="to">
    <slot />
  </NuxtLink>
  <a v-else-if="href" class="button" :class="`button--${variant}`" :href="href">
    <slot />
  </a>
  <button v-else class="button" :class="`button--${variant}`" type="button">
    <slot />
  </button>
</template>
