// hivefall-game/nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      /**
       * IMPORTANT:
       * - This value is baked into the static build during `npm run generate`.
       * - In GitHub Actions, set NUXT_PUBLIC_API_BASE to your Azure App Service URL.
       */
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? '',
    },
  },

  ssr: false,

  nitro: {
    prerender: { routes: [] },
  },

  css: ['vuetify/styles', '~/assets/hf-theme.css'],

  build: {
    transpile: ['vuetify'],
  },

  vite: {
    define: { 'process.env.DEBUG': false },
  },

  compatibilityDate: '2026-02-03',
})
