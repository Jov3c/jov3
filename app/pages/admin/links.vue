<script setup lang="ts">
import { FRIEND_LINK_STATUS_LABELS, type FriendLinkStatus } from '#shared/constants/friend-links';
import type { AdminMediaOption } from '~/types/blog';
import type {
  AdminFriendLink,
  AdminFriendLinksResponse,
  AdminFriendLinkStatus,
} from '~/types/friend-links';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const tabs: Array<{ value: AdminFriendLinkStatus; label: string }> = [
  { value: 'PENDING_REVIEW', label: '待审核' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'REJECTED', label: '已拒绝' },
];
const links = ref<AdminFriendLink[]>([]);
const media = ref<AdminMediaOption[]>([]);
const selectedStatus = ref<AdminFriendLinkStatus>('PUBLISHED');
const isLoading = ref(true);
const isCreating = ref(false);
const busyKey = ref('');
const notice = ref('');
const errorMessage = ref('');
const showCreate = ref(false);
const form = reactive({
  name: '',
  url: '',
  description: '',
  logoMediaId: '',
  sortOrder: 0,
  visible: true,
});

useSeoMeta({ title: '友链管理 — JOV3 管理后台', robots: 'noindex, nofollow' });

async function load() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const result = await $fetch<AdminFriendLinksResponse>('/api/v1/admin/links', {
      query: { page: 1, pageSize: 50, status: selectedStatus.value },
    });
    links.value = result.data;
  } catch {
    errorMessage.value = '友链列表加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
}

async function loadMedia() {
  try {
    const result = await $fetch<{ data: AdminMediaOption[] }>('/api/v1/admin/media', {
      query: { page: 1, pageSize: 60, q: '' },
    });
    media.value = result.data;
  } catch {
    media.value = [];
  }
}

function selectTab(status: AdminFriendLinkStatus) {
  selectedStatus.value = status;
  void load();
}

async function createLink() {
  isCreating.value = true;
  errorMessage.value = '';
  notice.value = '';
  try {
    await $fetch('/api/v1/admin/links', {
      method: 'POST',
      body: {
        name: form.name,
        url: form.url,
        description: form.description,
        logoMediaId: form.logoMediaId || null,
        sortOrder: Number(form.sortOrder),
        visible: form.visible,
      },
    });
    notice.value = '友链已直接发布。';
    Object.assign(form, {
      name: '',
      url: '',
      description: '',
      logoMediaId: '',
      sortOrder: 0,
      visible: true,
    });
    showCreate.value = false;
    selectedStatus.value = 'PUBLISHED';
    await load();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '友链创建失败，请检查输入。');
  } finally {
    isCreating.value = false;
  }
}

async function approve(link: AdminFriendLink) {
  await runAction(`${link.id}:approve`, async () => {
    await $fetch(`/api/v1/admin/links/${link.id}/approve`, { method: 'PATCH' });
    notice.value = '友链已通过审核并公开。';
    await load();
  });
}

async function reject(link: AdminFriendLink) {
  await runAction(`${link.id}:reject`, async () => {
    await $fetch(`/api/v1/admin/links/${link.id}/reject`, { method: 'PATCH' });
    notice.value = '友链申请已拒绝。';
    await load();
  });
}

async function toggleVisible(link: AdminFriendLink) {
  await runAction(`${link.id}:visible`, async () => {
    await $fetch(`/api/v1/admin/links/${link.id}`, {
      method: 'PATCH',
      body: { visible: !link.visible },
    });
    notice.value = link.visible ? '友链已隐藏。' : '友链已显示。';
    await load();
  });
}

async function remove(link: AdminFriendLink) {
  if (!window.confirm(`确定删除「${link.name}」吗？此操作不可恢复。`)) return;
  await runAction(`${link.id}:delete`, async () => {
    await $fetch(`/api/v1/admin/links/${link.id}`, { method: 'DELETE' });
    notice.value = '友链已删除。';
    await load();
  });
}

async function runAction(key: string, action: () => Promise<void>) {
  busyKey.value = key;
  errorMessage.value = '';
  try {
    await action();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '操作失败，请重试。');
  } finally {
    busyKey.value = '';
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  const fetchError = error as { data?: { error?: { message?: string } } };
  return fetchError.data?.error?.message || fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function domain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

onMounted(async () => {
  await Promise.all([load(), loadMedia()]);
});
</script>

<template>
  <div class="friend-links-admin">
    <header class="admin-page-heading">
      <div>
        <p>互动管理 / 友链</p>
        <h1>友链管理</h1>
      </div>
      <button class="button" type="button" @click="showCreate = !showCreate">
        {{ showCreate ? '收起表单' : '添加友链' }}
      </button>
    </header>

    <section v-if="showCreate" class="friend-link-create-panel">
      <div>
        <p class="eyebrow">管理员发布</p>
        <h2>直接添加一个公开入口</h2>
        <p>管理员新增无需邮箱验证，保存后会直接发布。</p>
      </div>
      <form class="friend-link-create-form" @submit.prevent="createLink">
        <div class="form-row">
          <label><span>名称</span><input v-model="form.name" required maxlength="120" /></label>
          <label
            ><span>网站地址</span><input v-model="form.url" required type="url" maxlength="500"
          /></label>
        </div>
        <label
          ><span>描述</span><input v-model="form.description" required maxlength="300"
        /></label>
        <div class="form-row">
          <label>
            <span>站点图标</span>
            <select v-model="form.logoMediaId">
              <option value="">不使用图标，显示名称缩写</option>
              <option v-for="asset in media" :key="asset.id" :value="asset.id">
                {{ asset.originalName }}
              </option>
            </select>
          </label>
          <label><span>排序</span><input v-model.number="form.sortOrder" type="number" /></label>
        </div>
        <label class="friend-link-checkbox"
          ><input v-model="form.visible" type="checkbox" /> <span>在公开友链页面显示</span></label
        >
        <button class="button" type="submit" :disabled="isCreating">
          {{ isCreating ? '正在保存…' : '发布友链' }}
        </button>
      </form>
    </section>

    <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
    <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>

    <nav class="friend-link-tabs" aria-label="友链状态">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="selectedStatus === tab.value"
        :class="{ 'is-active': selectedStatus === tab.value }"
        @click="selectTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <p v-if="isLoading" class="media-empty">正在加载友链…</p>
    <p v-else-if="!links.length" class="media-empty">当前状态下没有友链。</p>
    <section v-else class="friend-link-admin-list">
      <article v-for="link in links" :key="link.id" class="friend-link-admin-card">
        <div class="friend-link-admin-card__avatar">
          <img v-if="link.logo" :src="link.logo.publicUrl" :alt="link.logo.altText || link.name" />
          <span v-else>{{ link.name.slice(0, 2).toUpperCase() }}</span>
        </div>
        <div class="friend-link-admin-card__body">
          <header>
            <div>
              <strong>{{ link.name }}</strong>
              <a :href="link.url" target="_blank" rel="noreferrer">{{ domain(link.url) }} ↗</a>
            </div>
            <span class="moderation-status">{{
              FRIEND_LINK_STATUS_LABELS[link.status as FriendLinkStatus]
            }}</span>
          </header>
          <p>{{ link.description }}</p>
          <small
            >{{ link.source === 'APPLICATION' ? '访客申请' : '管理员添加' }} ·
            {{ formatDate(link.createdAt) }}</small
          >
          <small v-if="link.contactEmail">联系方式：{{ link.contactEmail }}</small>
          <blockquote v-if="link.applicantNote">{{ link.applicantNote }}</blockquote>
          <div class="friend-link-admin-card__actions">
            <button
              v-if="link.status === 'PENDING_REVIEW'"
              class="button"
              type="button"
              :disabled="!!busyKey"
              @click="approve(link)"
            >
              通过
            </button>
            <button
              v-if="link.status === 'PENDING_REVIEW'"
              class="admin-secondary-button"
              type="button"
              :disabled="!!busyKey"
              @click="reject(link)"
            >
              拒绝
            </button>
            <button
              v-if="link.status === 'PUBLISHED'"
              class="admin-secondary-button"
              type="button"
              :disabled="!!busyKey"
              @click="toggleVisible(link)"
            >
              {{ link.visible ? '隐藏' : '显示' }}
            </button>
            <button
              class="admin-danger-button"
              type="button"
              :disabled="!!busyKey"
              @click="remove(link)"
            >
              删除
            </button>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>
