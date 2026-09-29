export default defineNuxtConfig({
  compatibilityDate: '2026-09-29',
  css: ['~/assets/css/main.css', 'maplibre-gl/dist/maplibre-gl.css'],
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  vite: {
    optimizeDeps: { exclude: ['maplibre-gl'] },
  },
  ssr: true,
  typescript: {
    strict: true,
    typeCheck: true,
  },
});
