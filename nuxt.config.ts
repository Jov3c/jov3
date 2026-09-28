export default defineNuxtConfig({
  compatibilityDate: '2026-09-29',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  ssr: true,
  typescript: {
    strict: true,
    typeCheck: true,
  },
});
