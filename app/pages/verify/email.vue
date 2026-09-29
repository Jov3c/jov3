<script setup lang="ts">
const route = useRoute();
const status = ref<'loading' | 'success' | 'error' | 'missing'>('loading');

useSeoMeta({ title: 'Email verification — Jov3', robots: 'noindex, nofollow' });

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : '';
  window.history.replaceState({}, '', '/verify/email');
  if (!token) {
    status.value = 'missing';
    return;
  }

  try {
    await $fetch('/api/v1/public/email/verify', {
      method: 'POST',
      body: { token },
    });
    status.value = 'success';
  } catch {
    status.value = 'error';
  }
});
</script>

<template>
  <main class="verification-page">
    <NuxtLink class="verification-brand" to="/">JOV3<span>.</span></NuxtLink>
    <section class="verification-card" aria-live="polite">
      <p class="eyebrow">Email verification</p>
      <template v-if="status === 'loading'">
        <h1>Checking your link…</h1>
        <p>请稍候，我们正在确认这个验证链接。</p>
      </template>
      <template v-else-if="status === 'success'">
        <h1>Email verified.</h1>
        <p>邮箱验证成功。你可以回到刚才的页面继续操作。</p>
        <NuxtLink class="button" to="/">Back to JOV3</NuxtLink>
      </template>
      <template v-else-if="status === 'missing'">
        <h1>Verification link missing.</h1>
        <p>这个页面需要从邮件中的验证链接打开。</p>
        <NuxtLink class="button" to="/">Back to JOV3</NuxtLink>
      </template>
      <template v-else>
        <h1>Link unavailable.</h1>
        <p>这个验证链接无效、已过期，或已经使用过。</p>
        <NuxtLink class="button" to="/">Back to JOV3</NuxtLink>
      </template>
    </section>
  </main>
</template>
