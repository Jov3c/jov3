<script setup lang="ts">
import { aboutNavigation } from '~/data/navigation';

const route = useRoute();
const isOpen = ref(false);
const root = ref<HTMLElement | null>(null);
const isAboutRoute = computed(() => route.path.startsWith('/about'));
const { data: publicCv } = await useFetch<{ data: unknown }>('/api/v1/public/cv', {
  key: 'about-cv-visibility',
  ignoreResponseError: true,
});
const visibleAboutNavigation = computed(() =>
  publicCv.value?.data ? aboutNavigation : aboutNavigation.filter((item) => item.label !== 'CV'),
);

function close() {
  isOpen.value = false;
}

function handleFocusout(event: FocusEvent) {
  const nextTarget = event.relatedTarget as Node | null;
  if (root.value && nextTarget && !root.value.contains(nextTarget)) close();
}

function handlePointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) close();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close();
}

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div ref="root" class="about-menu" @focusout="handleFocusout">
    <button
      class="nav-link nav-link--button"
      :class="{ 'router-link-active': isAboutRoute }"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      About
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="m4 6 4 4 4-4" />
      </svg>
    </button>
    <div v-show="isOpen" class="about-menu__panel" role="menu">
      <NuxtLink
        v-for="item in visibleAboutNavigation"
        :key="item.to"
        :to="item.to"
        role="menuitem"
        @click="close"
      >
        {{ item.label }}
      </NuxtLink>
    </div>
  </div>
</template>
