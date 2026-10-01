<script setup lang="ts">
import type { PublicMessage, PublicMessagesResponse } from '~/types/community';

const form = reactive({ nickname: 'jov3 visitor', email: '', content: '', isPrivate: false });
const messages = ref<PublicMessage[]>([]);
const isSubmitting = ref(false);
const notice = ref('');
const errorMessage = ref('');

const { data, error, refresh } = await useFetch<PublicMessagesResponse>('/api/v1/public/messages', {
  query: { page: 1, pageSize: 20 },
});

messages.value = data.value?.data ?? [];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  })
    .format(new Date(value))
    .replaceAll('/', '-')
    .replace(',', '');
}

async function submit() {
  isSubmitting.value = true;
  notice.value = '';
  errorMessage.value = '';
  try {
    const isPrivate = form.isPrivate;
    await $fetch('/api/v1/public/messages', { method: 'POST', body: form });
    notice.value = isPrivate
      ? '验证邮件已发送。完成邮箱验证后，这条悄悄话仅博主可见。'
      : '验证邮件已发送。完成邮箱验证后，留言会自动显示。';
    form.content = '';
    form.isPrivate = false;
    await refresh();
    messages.value = data.value?.data ?? messages.value;
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } };
    errorMessage.value = fetchError.data?.error?.message || '留言失败，请检查字段后重试。';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="message-board" aria-labelledby="message-board-title">
    <form class="community-form message-board__form" @submit.prevent="submit">
      <div class="community-form__heading">
        <h2 id="message-board-title">写留言</h2>
        <span>邮箱验证后发布</span>
      </div>
      <textarea
        v-model="form.content"
        required
        maxlength="4000"
        placeholder="写点什么…"
        aria-label="留言内容"
      />
      <div class="community-form__fields community-form__fields--message">
        <input v-model="form.nickname" required maxlength="80" placeholder="昵称 *" />
        <input
          v-model="form.email"
          required
          type="email"
          maxlength="254"
          placeholder="邮箱 *（不会公开）"
        />
      </div>
      <div class="message-form-options">
        <label><input v-model="form.isPrivate" type="checkbox" /> 悄悄话</label>
      </div>
      <div class="community-form__actions">
        <p>想说点什么就留下来吧。</p>
        <button class="button" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '提交中…' : '留言' }}
        </button>
      </div>
      <p v-if="notice" class="community-notice" role="status">{{ notice }}</p>
      <p v-if="errorMessage" class="community-error" role="alert">{{ errorMessage }}</p>
    </form>

    <section class="message-panel" aria-live="polite">
      <div class="community-section-heading message-panel__heading">
        <div>
          <h2>留言</h2>
        </div>
        <span>{{ data?.meta.total ?? messages.length }} 条</span>
      </div>
      <p v-if="error" class="community-empty">留言暂时无法加载。</p>
      <p v-else-if="!messages.length" class="community-empty">还没有留言，欢迎留下第一句。</p>
      <div v-else class="community-list">
        <article v-for="message in messages" :key="message.id" class="community-card">
          <header>
            <div>
              <strong>{{ message.nickname }}</strong>
              <span>{{ formatDate(message.createdAt) }}</span>
            </div>
            <span v-if="message.authorType === 'ADMIN'" class="community-badge">博主</span>
          </header>
          <p>{{ message.content }}</p>
          <div v-if="message.replies.length" class="community-replies">
            <div v-for="reply in message.replies" :key="reply.id" class="community-reply">
              <header>
                <strong>{{ reply.nickname }}</strong>
                <span v-if="reply.authorType === 'ADMIN'" class="community-badge">博主</span>
                <time>{{ formatDate(reply.createdAt) }}</time>
              </header>
              <p>{{ reply.content }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
