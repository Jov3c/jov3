<script setup lang="ts">
defineProps<{
  stats?: { totalPosts: number; totalCategories: number; totalWords: number };
}>();

function formatWords(value: number | undefined) {
  if (value === undefined) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return String(value);
}
</script>

<template>
  <section class="profile-card">
    <div class="profile-card__avatar">J3</div>
    <h3>Jov3</h3>
    <p class="profile-role">产品 · AI · 开发者</p>
    <p class="profile-desc">在互联网上构建产品、工具与想法。</p>
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
      <a href="https://github.com/Jov3c" target="_blank" rel="noreferrer">GitHub</a>
      <a href="mailto:hello@example.com">邮箱</a>
      <a href="/rss.xml">RSS</a>
    </div>
  </section>
</template>
