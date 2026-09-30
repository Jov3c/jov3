<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import type { PublicFriendLinksResponse } from '~/types/friend-links';

const { data, pending, error } = await useFetch<PublicFriendLinksResponse>('/api/v1/public/links', {
  key: 'public-friend-links',
});

const friendLinks = computed(() => data.value?.data ?? []);
const prototypeDescriptions: Record<string, string> = {
  FeiTwnd: '技术、生活与胡思乱想。',
  Mori: '记录设计、摄影和一点点日常。',
  Northwind: '写代码，也写一些关于产品的想法。',
  Aster: 'Web、AI 和长期主义。',
  Haru: '一个很慢很慢更新的小站。',
  Sora: '一些技术笔记和生活碎片。',
};
const displayLinks = computed(() =>
  friendLinks.value.map((friend) => ({
    ...friend,
    description: prototypeDescriptions[friend.name] ?? friend.description,
  })),
);
const application = reactive({
  websiteName: '',
  websiteUrl: '',
  description: '',
  contactEmail: '',
  note: '',
});
const applicationNotice = ref('');
const applicationError = ref('');
const isApplying = ref(false);

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

async function submitApplication() {
  isApplying.value = true;
  applicationNotice.value = '';
  applicationError.value = '';
  try {
    await $fetch('/api/v1/public/links/apply', { method: 'POST', body: application });
    applicationNotice.value = '申请已收到，请先检查邮箱完成验证。';
    Object.assign(application, {
      websiteName: '',
      websiteUrl: '',
      description: '',
      contactEmail: '',
      note: '',
    });
  } catch (requestError) {
    const fetchError = requestError as { data?: { error?: { message?: string } } };
    applicationError.value = fetchError.data?.error?.message || '申请提交失败，请稍后重试。';
  } finally {
    isApplying.value = false;
  }
}
</script>

<template>
  <BlogChrome>
    <template #hero>
      <header class="links-hero">
        <p class="links-hero__eyebrow">FRIENDS</p>
        <h1>Links</h1>
        <p>一些我会经常拜访的小站。互联网很大，能留下彼此的入口是一件很有意思的事。</p>
      </header>
    </template>

    <section class="friend-links-section" aria-labelledby="friend-links-heading">
      <header class="friend-links-section__header">
        <div>
          <h2 id="friend-links-heading">朋友们的小站</h2>
        </div>
        <span>{{ displayLinks.length }} 位朋友</span>
      </header>

      <p v-if="error" class="community-empty" role="alert">友链暂时无法加载，请稍后重试。</p>
      <div
        v-else-if="pending"
        class="friend-link-grid friend-link-grid--skeleton"
        aria-label="正在加载友链"
      >
        <span v-for="index in 6" :key="index" />
      </div>
      <p v-else-if="displayLinks.length === 0" class="community-empty">还没有公开的友链。</p>
      <div v-else class="friend-link-grid">
        <a
          v-for="friend in displayLinks"
          :key="friend.id"
          class="friend-link-card"
          :href="friend.url"
          target="_blank"
          rel="noreferrer"
        >
          <span class="friend-link-card__avatar">
            <img
              v-if="friend.logo"
              :src="friend.logo.publicUrl"
              :alt="friend.logo.altText || `${friend.name} logo`"
              loading="lazy"
            />
            <span v-else>{{ initials(friend.name) }}</span>
          </span>
          <span class="friend-link-card__body">
            <strong>{{ friend.name }}</strong>
            <small>{{ friend.description }}</small>
            <em>{{ domain(friend.url) }}</em>
          </span>
          <b aria-hidden="true">↗</b>
        </a>
      </div>
    </section>

    <section
      class="friend-link-apply friend-link-apply--prototype-hidden"
      aria-labelledby="friend-link-apply-heading"
    >
      <div>
        <p class="eyebrow">Leave an entrance</p>
        <h2 id="friend-link-apply-heading">想交换友链？</h2>
        <p>填写站点信息并验证邮箱，确认后会进入后台审核队列。</p>
      </div>
      <form class="friend-link-apply__form" @submit.prevent="submitApplication">
        <div class="form-row">
          <label
            ><span>网站名称</span><input v-model="application.websiteName" required maxlength="120"
          /></label>
          <label
            ><span>网站地址</span
            ><input v-model="application.websiteUrl" required type="url" maxlength="500"
          /></label>
        </div>
        <div class="form-row">
          <label
            ><span>联系邮箱</span
            ><input v-model="application.contactEmail" required type="email" maxlength="254"
          /></label>
          <label
            ><span>一句介绍</span><input v-model="application.description" required maxlength="300"
          /></label>
        </div>
        <label
          ><span>留言（可选）</span><textarea v-model="application.note" rows="3" maxlength="500" />
        </label>
        <div class="friend-link-apply__actions">
          <span v-if="applicationNotice" class="admin-notice" role="status">{{
            applicationNotice
          }}</span>
          <span v-if="applicationError" class="admin-error" role="alert">{{
            applicationError
          }}</span>
          <button class="button" type="submit" :disabled="isApplying">
            {{ isApplying ? '提交中…' : '提交申请' }}
          </button>
        </div>
      </form>
    </section>
  </BlogChrome>
</template>
