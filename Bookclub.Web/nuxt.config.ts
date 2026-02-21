import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  ssr: false,
    devtools: { enabled: true },
    plugins: ['~/plugins/vuetify.ts'],

  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.css'],

  build: {
    transpile: ['vuetify'],
  },

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    plugins: [
      vuetify({ autoImport: true }) as any,
    ],
  },

  compatibilityDate: '2025-01-01',
})