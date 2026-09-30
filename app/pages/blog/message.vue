<script setup lang="ts">
import BlogChrome from '~/components/blog/BlogChrome.vue';
import MessageBoard from '~/components/blog/MessageBoard.vue';

usePageSeo({
  title: 'Message — Blog — Jov3',
  description: '想说点什么就留下来吧。可以是建议、问题，也可以只是打个招呼。',
});
definePageMeta({ layout: 'blog-prototype' });
</script>

<template>
  <BlogChrome>
    <template #hero>
      <header class="message-hero">
        <p class="eyebrow">GUESTBOOK</p>
        <h1>Message</h1>
        <p>想说点什么就留下来吧。可以是建议、问题，也可以只是打个招呼。</p>
      </header>
    </template>
    <MessageBoard />
  </BlogChrome>
</template>
