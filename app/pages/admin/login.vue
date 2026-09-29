<script setup lang="ts">
definePageMeta({ layout: 'admin-auth' });

const route = useRoute();
const form = reactive({ email: '', password: '' });
const isHydrated = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

useSeoMeta({ title: 'Admin login — Jov3', robots: 'noindex, nofollow' });
onMounted(() => {
  isHydrated.value = true;
});

async function submit() {
  isSubmitting.value = true;
  errorMessage.value = '';
  try {
    await $fetch('/api/v1/auth/login', {
      method: 'POST',
      body: form,
    });
    const requested = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin';
    const destination =
      requested.startsWith('/admin') && requested !== '/admin/login' ? requested : '/admin';
    await navigateTo(destination, { external: true });
  } catch (error) {
    const fetchError = error as { data?: { error?: { message?: string } }; statusCode?: number };
    errorMessage.value =
      fetchError.statusCode === 429
        ? '尝试次数过多，请稍后再试。'
        : fetchError.data?.error?.message || '登录失败，请检查邮箱和密码。';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="login-panel">
    <div class="login-panel__intro">
      <p class="eyebrow">Admin console</p>
      <h1>Welcome back.</h1>
      <p>管理内容、资料和站点设置。这里只有一个管理员入口。</p>
    </div>

    <form @submit.prevent="submit">
      <label for="admin-email">Email</label>
      <input id="admin-email" v-model="form.email" type="email" autocomplete="username" required />
      <label for="admin-password">Password</label>
      <input
        id="admin-password"
        v-model="form.password"
        type="password"
        autocomplete="current-password"
        required
      />
      <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>
      <button class="button" type="submit" :disabled="!isHydrated || isSubmitting">
        {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </main>
</template>
