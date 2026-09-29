<script setup lang="ts">
import type { BlogCategory } from '~/types/blog';

const props = defineProps<{ categories: BlogCategory[] }>();

const route = useRoute();
const isOpen = ref(false);
const selectedSlug = computed(() => {
  const value = route.query.category;
  return typeof value === 'string' ? value : '';
});
const selectedLabel = computed(() => {
  if (!selectedSlug.value) return '全部分类';
  return (
    props.categories.find((category) => category.slug === selectedSlug.value)?.name ??
    selectedSlug.value
  );
});

async function selectCategory(slug: string) {
  isOpen.value = false;
  await navigateTo({
    path: '/blog',
    query: slug ? { category: slug } : {},
  });
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') isOpen.value = false;
}

onMounted(() => document.addEventListener('keydown', closeOnEscape));
onBeforeUnmount(() => document.removeEventListener('keydown', closeOnEscape));
</script>

<template>
  <div class="category-menu" :class="{ open: isOpen }">
    <button
      class="category-trigger"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span class="category-text">{{ selectedLabel }}</span>
      <span class="chevron" aria-hidden="true">⌄</span>
    </button>
    <div v-if="isOpen" class="category-popover" role="listbox" aria-label="文章分类">
      <button
        class="category-option"
        :aria-selected="!selectedSlug"
        type="button"
        role="option"
        @click="selectCategory('')"
      >
        <span>全部分类</span>
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-option"
        :aria-selected="category.slug === selectedSlug"
        type="button"
        role="option"
        @click="selectCategory(category.slug)"
      >
        <span>{{ category.name }}</span>
        <small>{{ category.postCount }}</small>
      </button>
    </div>
  </div>
</template>
