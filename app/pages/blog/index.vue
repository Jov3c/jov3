<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import CategoryFilter from '~/components/blog/CategoryFilter.vue';
import PostCard from '~/components/blog/PostCard.vue';
import ErrorState from '~/components/ui/ErrorState.vue';
import SkeletonBlock from '~/components/ui/SkeletonBlock.vue';
import StandardHero from '~/components/ui/StandardHero.vue';
import type { PublicCategoriesResponse, PublicPostsResponse } from '~/types/blog';

definePageMeta({ layout: 'blog-prototype' });

const route = useRoute();
const selectedCategory = computed(() =>
  typeof route.query.category === 'string' ? route.query.category : '',
);
const categoryQuery = computed(() => ({ page: 1, pageSize: 5, category: selectedCategory.value }));
const [{ data: postsResponse, pending, error, refresh }, { data: categoriesResponse }] =
  await Promise.all([
    useFetch<PublicPostsResponse>('/api/v1/public/posts', { query: categoryQuery }),
    useFetch<PublicCategoriesResponse>('/api/v1/public/categories', {
      key: 'public-blog-categories',
    }),
  ]);
const showPrototypeSkeleton = ref(true);

let skeletonTimer: number | undefined;

onMounted(() => {
  skeletonTimer = window.setTimeout(() => (showPrototypeSkeleton.value = false), 900);
});
onBeforeUnmount(() => window.clearTimeout(skeletonTimer));

function coverVariant(slug: string) {
  const prototypeOrder = ['server', 'ai', 'product', 'wechat', 'signal'];
  const prototypeIndex = prototypeOrder.indexOf(slug);
  if (prototypeIndex >= 0) return prototypeIndex + 1;

  const hash = [...slug].reduce((total, character) => total + character.charCodeAt(0), 0);
  return (hash % 5) + 1;
}

usePageSeo({ title: 'Blog — Jov3', description: '记录 AI、产品、开发和一些值得长期保留的想法。' });
</script>

<template>
  <BlogChrome>
    <template #category>
      <CategoryFilter :categories="categoriesResponse?.data ?? []" />
    </template>
    <template #hero>
      <StandardHero
        eyebrow="WRITING"
        title="Blog"
        description="记录 AI、产品、开发和一些值得长期保留的想法。"
      />
    </template>
    <div
      v-if="showPrototypeSkeleton || pending"
      class="post-list post-list--loading"
      aria-label="正在加载文章"
    >
      <div v-for="index in 5" :key="index" class="post-card post-card--skeleton">
        <SkeletonBlock class="post-card__skeleton-cover" />
        <div class="post-card__skeleton-body">
          <SkeletonBlock class="post-card__skeleton-meta" />
          <SkeletonBlock class="post-card__skeleton-title" />
          <SkeletonBlock class="post-card__skeleton-line" />
          <SkeletonBlock class="post-card__skeleton-line post-card__skeleton-line--short" />
        </div>
      </div>
    </div>
    <ErrorState v-else-if="error" title="文章暂时无法加载" description="请稍后再试。">
      <button class="button button--ghost" type="button" @click="refresh()">重新加载</button>
    </ErrorState>
    <div v-else-if="postsResponse?.data.items.length === 0" class="state-panel">
      <h2>这个分类还没有文章。</h2>
      <p>换一个分类，或者回到全部文章。</p>
    </div>
    <div v-else class="post-list">
      <PostCard
        v-for="(post, index) in postsResponse?.data.items"
        :key="post.slug"
        :post="post"
        :featured="index === 0"
        :cover-variant="coverVariant(post.slug)"
      />
    </div>
  </BlogChrome>
</template>
