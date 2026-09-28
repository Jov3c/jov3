interface MeResponse {
  data: { admin: { id: string; email: string; displayName: string } };
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return;

  const admin = useAdminSession();
  try {
    const response = await $fetch<MeResponse>('/api/v1/auth/me', {
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
    });
    admin.value = response.data.admin;
  } catch {
    admin.value = null;
    return navigateTo({ path: '/admin/login', query: { redirect: to.fullPath } });
  }
});
