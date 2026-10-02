<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import SkeletonBlock from '~/components/ui/SkeletonBlock.vue';
import StandardHero from '~/components/ui/StandardHero.vue';
import type { PublicFriendLinksResponse } from '~/types/friend-links';

const { data, pending, error } = await useFetch<PublicFriendLinksResponse>('/api/v1/public/links', {
  key: 'public-friend-links',
  query: { page: 1, pageSize: 6 },
});

const friendLinks = computed(() => data.value?.data ?? []);
const displayLinks = computed(() => friendLinks.value.slice(0, 6));
const showPrototypeSkeleton = ref(true);

let skeletonTimer: number | undefined;

onMounted(() => {
  skeletonTimer = window.setTimeout(() => (showPrototypeSkeleton.value = false), 850);
});
onBeforeUnmount(() => window.clearTimeout(skeletonTimer));

definePageMeta({ layout: 'blog-prototype' });

usePageSeo({
  title: 'Links — Blog — Jov3',
  description: '一些我会经常拜访的小站。互联网很大，能留下彼此的入口是一件很有意思的事。',
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function domain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function avatarClass(index: number) {
  return `avatar-${String.fromCharCode(97 + (index % 6))}`;
}
</script>

<template>
  <BlogChrome>
    <template #hero>
      <StandardHero
        eyebrow="FRIENDS"
        title="Links"
        description="一些我会经常拜访的小站。互联网很大，能留下彼此的入口是一件很有意思的事。"
      />
    </template>

    <section class="links-card" aria-labelledby="friend-links-heading">
      <header class="links-head">
        <h2 id="friend-links-heading">朋友们的小站</h2>
        <small>{{
          showPrototypeSkeleton || pending ? 'Loading…' : `${displayLinks.length} 位朋友`
        }}</small>
      </header>

      <div v-if="showPrototypeSkeleton || pending" class="link-grid" aria-label="正在加载友链">
        <div v-for="index in 6" :key="index" class="link-card link-card--skeleton">
          <SkeletonBlock class="link-card__skeleton-avatar" />
          <div class="link-card__skeleton-text">
            <SkeletonBlock class="link-card__skeleton-name" />
            <SkeletonBlock class="link-card__skeleton-description" />
          </div>
        </div>
      </div>
      <p v-else-if="error" class="community-empty" role="alert">友链暂时无法加载，请稍后重试。</p>
      <p v-else-if="displayLinks.length === 0" class="community-empty">还没有公开的友链。</p>
      <div v-else class="link-grid">
        <a
          v-for="(friend, index) in displayLinks"
          :key="friend.id"
          class="link-card"
          :href="friend.url"
          target="_blank"
          rel="noreferrer"
        >
          <span class="link-avatar" :class="avatarClass(index)">
            <img
              v-if="friend.logo"
              :src="friend.logo.publicUrl"
              :alt="friend.logo.altText || `${friend.name} logo`"
              loading="lazy"
            />
            <span v-else>{{ initials(friend.name) }}</span>
          </span>
          <span class="link-body">
            <span class="link-name">{{ friend.name }}</span>
            <span class="link-desc">{{ friend.description }}</span>
            <span class="link-domain">{{ domain(friend.url) }}</span>
          </span>
        </a>
      </div>
    </section>
  </BlogChrome>
</template>
