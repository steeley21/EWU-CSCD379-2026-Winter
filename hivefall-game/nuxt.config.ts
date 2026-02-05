export default {
  ssr: false,
  nitro: {
    prerender: { routes: [] }
  },
  css: [
    'vuetify/styles',
    '~/assets/hf-theme.css',
  ],
  build: {
    transpile: ['vuetify']
  },
  vite: {
    define: { 'process.env.DEBUG': false }
  },
  compatibilityDate: '2026-02-03'
} as const
