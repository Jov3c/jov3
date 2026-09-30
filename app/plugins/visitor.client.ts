export default defineNuxtPlugin((nuxtApp) => {
  let lastTrackedPath = '';

  function shouldTrack(path: string) {
    return (
      path === '/' ||
      (!path.startsWith('/admin') &&
        !path.startsWith('/api/') &&
        !path.startsWith('/uploads/') &&
        !path.startsWith('/verify/'))
    );
  }

  function ping(path: string) {
    const normalizedPath = path.split(/[?#]/, 1)[0] || '/';
    if (!shouldTrack(normalizedPath) || normalizedPath === lastTrackedPath) return;
    lastTrackedPath = normalizedPath;
    void $fetch('/api/v1/public/visit/ping', {
      method: 'POST',
      body: { path: normalizedPath },
      credentials: 'include',
    }).catch(() => undefined);
  }

  nuxtApp.hook('app:mounted', () => ping(window.location.pathname));
  nuxtApp.$router.afterEach((to) => ping(to.path));
});
