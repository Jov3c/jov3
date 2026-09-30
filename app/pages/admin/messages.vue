<script setup lang="ts">
import {
  MODERATION_STATUS_LABELS,
  MODERATION_STATUSES,
  type ModerationActionStatus,
  type ModerationStatus,
} from '#shared/constants/moderation';
import type { AdminMessage } from '~/types/community';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const messages = ref<AdminMessage[]>([]);
const statusFilter = ref<ModerationStatus | ''>('');
const replyDrafts = reactive<Record<string, string>>({});
const isLoading = ref(true);
const busyKey = ref('');
const notice = ref('');
const errorMessage = ref('');

useSeoMeta({ title: 'Messages — Jov3 Admin', robots: 'noindex, nofollow' });

async function load() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const result = await $fetch<{ data: AdminMessage[] }>('/api/v1/admin/messages', {
      query: {
        page: 1,
        pageSize: 50,
        ...(statusFilter.value ? { status: statusFilter.value } : {}),
      },
    });
    messages.value = result.data;
  } catch {
    errorMessage.value = 'Messages 加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
}

async function updateStatus(id: string, status: ModerationActionStatus) {
  await runAction(`${id}:${status}`, async () => {
    await $fetch(`/api/v1/admin/messages/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    notice.value = '留言状态已更新。';
    await load();
  });
}

async function reply(message: AdminMessage) {
  const content = replyDrafts[message.id]?.trim();
  if (!content) return;
  await runAction(`${message.id}:reply`, async () => {
    await $fetch(`/api/v1/admin/messages/${message.id}/reply`, {
      method: 'POST',
      body: { content },
    });
    replyDrafts[message.id] = '';
    notice.value = '回复已发布。';
    await load();
  });
}

async function remove(message: AdminMessage) {
  if (!window.confirm(`确定删除「${message.nickname}」的留言吗？此操作不可恢复。`)) return;
  await runAction(`${message.id}:delete`, async () => {
    await $fetch(`/api/v1/admin/messages/${message.id}`, { method: 'DELETE' });
    notice.value = '留言已删除。';
    await load();
  });
}

async function runAction(key: string, action: () => Promise<void>) {
  busyKey.value = key;
  errorMessage.value = '';
  try {
    await action();
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } };
    errorMessage.value = fetchError.data?.error?.message || '操作失败，请重试。';
  } finally {
    busyKey.value = '';
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

onMounted(load);
</script>

<template>
  <div class="moderation-admin">
    <header class="admin-page-heading">
      <div>
        <p>Community / Messages</p>
        <h1>Messages</h1>
      </div>
      <NuxtLink class="admin-secondary-button" to="/admin/comments">Comments →</NuxtLink>
    </header>

    <section class="home-admin-section moderation-toolbar">
      <div>
        <p class="eyebrow">Guestbook queue</p>
        <h2>留言板里的来信</h2>
      </div>
      <label
        >状态
        <select v-model="statusFilter" @change="load">
          <option value="">全部状态</option>
          <option v-for="status in MODERATION_STATUSES" :key="status" :value="status">
            {{ MODERATION_STATUS_LABELS[status] }}
          </option>
        </select>
      </label>
    </section>

    <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
    <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>
    <p v-if="isLoading" class="media-empty">Loading messages…</p>
    <p v-else-if="!messages.length" class="media-empty">当前筛选下没有留言。</p>
    <section v-else class="moderation-list">
      <article
        v-for="message in messages"
        :key="message.id"
        class="moderation-card"
        :data-status="message.status.toLowerCase()"
      >
        <header class="moderation-card__header">
          <div>
            <strong>{{ message.nickname }}</strong>
            <span>{{ message.email || 'admin reply' }}</span>
          </div>
          <span class="moderation-status">{{ MODERATION_STATUS_LABELS[message.status] }}</span>
        </header>
        <p class="moderation-card__meta">
          <span>{{ formatDate(message.createdAt) }}</span>
          <span v-if="message.isPrivate">悄悄话</span>
          <span v-if="message.parent">回复 {{ message.parent.nickname }}</span>
        </p>
        <p class="moderation-card__content">{{ message.content }}</p>
        <div class="moderation-card__actions">
          <button
            v-if="message.status !== 'HIDDEN'"
            class="admin-secondary-button"
            type="button"
            :disabled="!!busyKey"
            @click="updateStatus(message.id, 'HIDDEN')"
          >
            Hide
          </button>
          <button
            v-if="message.status !== 'SPAM'"
            class="admin-secondary-button"
            type="button"
            :disabled="!!busyKey"
            @click="updateStatus(message.id, 'SPAM')"
          >
            Spam
          </button>
          <button
            v-if="message.status === 'HIDDEN' || message.status === 'SPAM'"
            class="admin-secondary-button"
            type="button"
            :disabled="!!busyKey"
            @click="updateStatus(message.id, 'PUBLISHED')"
          >
            Restore
          </button>
          <button
            class="admin-danger-button"
            type="button"
            :disabled="!!busyKey"
            @click="remove(message)"
          >
            Delete
          </button>
        </div>
        <form
          v-if="!message.parentId && message.authorType !== 'ADMIN'"
          class="moderation-reply"
          @submit.prevent="reply(message)"
        >
          <textarea v-model="replyDrafts[message.id]" rows="2" placeholder="回复这条留言…" />
          <button class="button" type="submit" :disabled="!!busyKey">Reply</button>
        </form>
      </article>
    </section>
  </div>
</template>
