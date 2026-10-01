<script setup lang="ts">
import type { PublicHomeProfile, PublicHomeSocialLink } from '~/types/home';

defineProps<{
  stats?: { totalPosts: number; totalCategories: number; totalWords: number };
  profile?: PublicHomeProfile;
  socialLinks?: PublicHomeSocialLink[];
  contactEmail?: string | null;
}>();

function formatWords(value: number | undefined) {
  if (value === undefined) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return String(value);
}
</script>

<template>
  <section class="profile-card">
    <div v-if="profile?.avatar" class="profile-card__avatar profile-card__avatar--image">
      <img :src="profile.avatar.url" :alt="profile.avatar.altText || profile.nickname" />
    </div>
    <div v-else class="profile-card__avatar">{{ profile?.nickname?.slice(0, 2) || '—' }}</div>
    <h3>{{ profile?.nickname || '—' }}</h3>
    <p class="profile-role">{{ profile?.role || '—' }}</p>
    <p class="profile-desc">{{ profile?.intro || '—' }}</p>
    <div class="stats">
      <div class="stat">
        <strong>{{ stats?.totalPosts ?? '—' }}</strong
        ><span>文章</span>
      </div>
      <div class="stat">
        <strong>{{ stats?.totalCategories ?? '—' }}</strong
        ><span>分类</span>
      </div>
      <div class="stat">
        <strong>{{ formatWords(stats?.totalWords) }}</strong
        ><span>字数</span>
      </div>
    </div>
    <div class="socials">
      <a
        v-for="link in socialLinks"
        :key="link.id"
        :href="link.url"
        :target="/^https?:/i.test(link.url) ? '_blank' : undefined"
        :rel="/^https?:/i.test(link.url) ? 'noreferrer' : undefined"
      >
        {{ link.name }}
      </a>
      <a v-if="contactEmail" :href="`mailto:${contactEmail}`">邮箱</a>
      <a href="/rss.xml">RSS</a>
    </div>
  </section>
</template>
