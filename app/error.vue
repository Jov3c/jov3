<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();
const isNotFound = computed(() => props.error.statusCode === 404);

useSeoMeta({ title: `${props.error.statusCode} — Jov3` });
</script>

<template>
  <div class="error-page">
    <div class="error-code">{{ error.statusCode }}</div>
    <p class="eyebrow">{{ isNotFound ? 'Not found' : 'Something went wrong' }}</p>
    <h1>{{ isNotFound ? 'This page wandered off.' : 'A small interruption.' }}</h1>
    <p>
      {{
        isNotFound
          ? '你要找的内容可能已移动，或者这个地址从未存在。'
          : '页面暂时无法正常显示，请稍后再试。'
      }}
    </p>
    <NuxtLink class="button" to="/" @click="clearError({ redirect: '/' })">Back home</NuxtLink>
  </div>
</template>
