<script setup lang="ts">
import {
  MODERATION_STATUS_LABELS,
  MODERATION_STATUSES,
  type ModerationActionStatus,
  type ModerationStatus,
} from '#shared/constants/moderation';
import type { AdminComment } from '~/types/community';

definePageMeta({ layout: 'admin', middleware: 'admin' });

const comments = ref<AdminComment[]>([]);
const statusFilter = ref<ModerationStatus | ''>('');
const replyDrafts = reactive<Record<string, string>>({});
const isLoading = ref(true);
const busyKey = ref('');
const notice = ref('');
const errorMessage = ref('');

useSeoMeta({ title: '评论管理 — JOV3 管理后台', robots: 'noindex, nofollow' });

async function load() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const result = await $fetch<{ data: AdminComment[] }>('/api/v1/admin/comments', {
      query: {
        page: 1,
        pageSize: 50,
        ...(statusFilter.value ? { status: statusFilter.value } : {}),
      },
    });
    comments.value = result.data;
  } catch {
    errorMessage.value = 'Comments 加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
}

async function updateStatus(id: string, status: ModerationActionStatus) {
  await runAction(`${id}:${status}`, async () => {
    await $fetch(`/api/v1/admin/comments/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    notice.value = '评论状态已更新。';
    await load();
  });
}

async function reply(comment: AdminComment) {
  const content = replyDrafts[comment.id]?.trim();
  if (!content) return;
  await runAction(`${comment.id}:reply`, async () => {
    await $fetch(`/api/v1/admin/comments/${comment.id}/reply`, {
      method: 'POST',
      body: { content },
    });
    replyDrafts[comment.id] = '';
    notice.value = '回复已发布。';
    await load();
  });
}

async function remove(comment: AdminComment) {
  if (!window.confirm(`确定删除「${comment.nickname}」的评论吗？此操作不可恢复。`)) return;
  await runAction(`${comment.id}:delete`, async () => {
    await $fetch(`/api/v1/admin/comments/${comment.id}`, { method: 'DELETE' });
    notice.value = '评论已删除。';
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
        <p>互动管理 / 评论</p>
        <h1>评论管理</h1>
      </div>
      <NuxtLink class="admin-secondary-button" to="/admin/messages">留言管理 →</NuxtLink>
    </header>

    <section class="home-admin-section moderation-toolbar">
      <div>
        <p class="eyebrow">审核队列</p>
        <h2>文章里的每一次回应</h2>
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
    <p v-if="isLoading" class="media-empty">正在加载评论…</p>
    <p v-else-if="!comments.length" class="media-empty">当前筛选下没有评论。</p>
    <section v-else class="moderation-list">
      <article
        v-for="comment in comments"
        :key="comment.id"
        class="moderation-card"
        :data-status="comment.status.toLowerCase()"
      >
        <header class="moderation-card__header">
          <div>
            <strong>{{ comment.nickname }}</strong>
            <span>{{ comment.email || 'admin reply' }}</span>
          </div>
          <span class="moderation-status">{{ MODERATION_STATUS_LABELS[comment.status] }}</span>
        </header>
        <p class="moderation-card__meta">
          <NuxtLink v-if="comment.post" :to="`/blog/${comment.post.slug}`" target="_blank">
            {{ comment.post.title }}
          </NuxtLink>
          <span>{{ formatDate(comment.createdAt) }}</span>
          <span v-if="comment.parent">回复 {{ comment.parent.nickname }}</span>
        </p>
        <p class="moderation-card__content">{{ comment.content }}</p>
        <div class="moderation-card__actions">
          <button
            v-if="comment.status !== 'HIDDEN'"
            class="admin-secondary-button"
            type="button"
            :disabled="!!busyKey"
            @click="updateStatus(comment.id, 'HIDDEN')"
          >
            隐藏
          </button>
          <button
            v-if="comment.status !== 'SPAM'"
            class="admin-secondary-button"
            type="button"
            :disabled="!!busyKey"
            @click="updateStatus(comment.id, 'SPAM')"
          >
            标记垃圾内容
          </button>
          <button
            v-if="comment.status === 'HIDDEN' || comment.status === 'SPAM'"
            class="admin-secondary-button"
            type="button"
            :disabled="!!busyKey"
            @click="updateStatus(comment.id, 'PUBLISHED')"
          >
            恢复
          </button>
          <button
            class="admin-danger-button"
            type="button"
            :disabled="!!busyKey"
            @click="remove(comment)"
          >
            删除
          </button>
        </div>
        <form
          v-if="!comment.parentId && comment.authorType !== 'ADMIN'"
          class="moderation-reply"
          @submit.prevent="reply(comment)"
        >
          <textarea v-model="replyDrafts[comment.id]" rows="2" placeholder="回复这条评论…" />
          <button class="button" type="submit" :disabled="!!busyKey">回复</button>
        </form>
      </article>
    </section>
  </div>
</template>
