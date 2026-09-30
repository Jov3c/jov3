<script setup lang="ts">
import type { PublicComment, PublicCommentsResponse } from '~/types/community';

const props = defineProps<{ slug: string }>();

const form = reactive({ nickname: '', email: '', content: '' });
const comments = ref<PublicComment[]>([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const notice = ref('');
const errorMessage = ref('');
const replyingTo = ref<PublicComment | null>(null);

const { data, error, refresh } = await useFetch<PublicCommentsResponse>(
  `/api/v1/public/posts/${encodeURIComponent(props.slug)}/comments`,
  { query: { page: 1, pageSize: 20 } },
);

comments.value = data.value?.data ?? [];
isLoading.value = false;

const count = computed(() => data.value?.meta.publishedTotal ?? comments.value.length);

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(value))
    .replaceAll('/', '.');
}

function startReply(comment: PublicComment) {
  replyingTo.value = comment;
  form.content = `@${comment.nickname} `;
}

function cancelReply() {
  replyingTo.value = null;
  form.content = '';
}

async function submit() {
  isSubmitting.value = true;
  notice.value = '';
  errorMessage.value = '';
  try {
    await $fetch(`/api/v1/public/posts/${encodeURIComponent(props.slug)}/comments`, {
      method: 'POST',
      body: {
        nickname: form.nickname,
        email: form.email,
        content: form.content,
        parentId: replyingTo.value?.id ?? null,
      },
    });
    notice.value = '验证邮件已发送。完成邮箱验证后，评论会自动显示。';
    form.content = '';
    replyingTo.value = null;
    await refresh();
    comments.value = data.value?.data ?? comments.value;
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } } };
    errorMessage.value = fetchError.data?.error?.message || '提交失败，请检查字段后重试。';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="comment-section" aria-labelledby="comments-title">
    <div class="community-section-heading">
      <div>
        <p class="eyebrow">Conversation</p>
        <h2 id="comments-title">评论</h2>
      </div>
      <span>{{ count }} 条已公开</span>
    </div>

    <form class="community-form" @submit.prevent="submit">
      <div class="community-form__heading">
        <h3>{{ replyingTo ? `回复 ${replyingTo.nickname}` : '写评论' }}</h3>
        <span>纯文本 · 邮箱仅用于验证</span>
      </div>
      <textarea
        v-model="form.content"
        required
        maxlength="4000"
        placeholder="写点什么…"
        aria-label="评论内容"
      />
      <div class="community-form__fields">
        <input v-model="form.nickname" required maxlength="80" placeholder="昵称 *" />
        <input
          v-model="form.email"
          required
          type="email"
          maxlength="254"
          placeholder="邮箱 *（不会公开）"
        />
      </div>
      <div class="community-form__actions">
        <p v-if="replyingTo" class="community-form__replying">
          正在回复 {{ replyingTo.nickname }} ·
          <button type="button" @click="cancelReply">取消</button>
        </p>
        <p v-else>提交后请打开邮件完成验证。</p>
        <button class="button" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '提交中…' : '发表评论' }}
        </button>
      </div>
      <p v-if="notice" class="community-notice" role="status">{{ notice }}</p>
      <p v-if="errorMessage" class="community-error" role="alert">{{ errorMessage }}</p>
    </form>

    <div v-if="isLoading" class="community-list-skeleton" aria-label="正在加载评论">
      <span v-for="item in 3" :key="item" />
    </div>
    <p v-else-if="error" class="community-empty">评论暂时无法加载。</p>
    <p v-else-if="!comments.length" class="community-empty">还没有评论，留下第一句吧。</p>
    <div v-else class="community-list">
      <article v-for="comment in comments" :key="comment.id" class="community-card">
        <header>
          <div>
            <strong>{{ comment.nickname }}</strong>
            <span>{{ formatDate(comment.createdAt) }}</span>
          </div>
          <span v-if="comment.authorType === 'ADMIN'" class="community-badge">博主</span>
        </header>
        <p>{{ comment.content }}</p>
        <button class="community-reply-link" type="button" @click="startReply(comment)">
          回复
        </button>
        <div v-if="comment.replies.length" class="community-replies">
          <div v-for="reply in comment.replies" :key="reply.id" class="community-reply">
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
</template>
