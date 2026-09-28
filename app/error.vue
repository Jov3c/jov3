<script setup lang="ts">
import type { NuxtError } from '#app';
import ErrorState from '~/components/ui/ErrorState.vue';

const props = defineProps<{ error: NuxtError }>();
const isNotFound = computed(() => props.error.statusCode === 404);

useSeoMeta({ title: `${props.error.statusCode} — Jov3` });
</script>

<template>
  <div class="error-page">
    <ErrorState
      :code="error.statusCode"
      :label="isNotFound ? 'Not found' : 'Something went wrong'"
      :title="isNotFound ? 'This page wandered off.' : 'A small interruption.'"
      :description="
        isNotFound
          ? '你要找的内容可能已移动，或者这个地址从未存在。'
          : '页面暂时无法正常显示，请稍后再试。'
      "
    >
      <NuxtLink class="button" to="/" @click="clearError({ redirect: '/' })">Back home</NuxtLink>
    </ErrorState>
  </div>
</template>
