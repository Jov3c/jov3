<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import StandardHero from '~/components/ui/StandardHero.vue';
import { guestbookMessages } from '~/data/content';

useSeoMeta({ title: 'Guestbook — Blog — Jov3', description: '给 Jov3 留下一句话。' });
</script>

<template>
  <BlogChrome>
    <template #hero>
      <StandardHero
        eyebrow="Guestbook"
        title="Leave a small note."
        description="如果你路过这里，可以留下一句话。"
      />
    </template>
    <form class="message-form" @submit.prevent>
      <div class="form-row">
        <label
          >昵称<input name="name" autocomplete="name" placeholder="怎么称呼你" disabled
        /></label>
        <label
          >邮箱<input
            name="email"
            type="email"
            autocomplete="email"
            placeholder="不会公开"
            disabled
        /></label>
      </div>
      <label>留言<textarea name="message" rows="4" placeholder="写点什么吧" disabled /></label>
      <div class="form-note">
        <p>当前阶段仅展示表单，留言提交将在数据阶段开放。</p>
        <button class="button" type="submit" disabled>Send note</button>
      </div>
    </form>

    <div class="message-list">
      <article
        v-for="message in guestbookMessages"
        :key="`${message.name}-${message.date}`"
        class="message-card"
      >
        <header>
          <strong>{{ message.name }}</strong
          ><time>{{ message.date }}</time>
        </header>
        <p>{{ message.content }}</p>
        <div v-if="message.reply" class="message-reply">
          <header>
            <strong>{{ message.reply.name }} · author</strong><time>{{ message.reply.date }}</time>
          </header>
          <p>{{ message.reply.content }}</p>
        </div>
      </article>
    </div>
  </BlogChrome>
</template>
