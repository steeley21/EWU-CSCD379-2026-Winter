export default {
  ssr: false,
  // Static target: generate a static site with `nuxi generate`
  nitro: {
    prerender: {
      routes: []
    }
  },
  css: ['vuetify/styles'],
  build: {
    transpile: ['vuetify']
  },
  vite: {
    define: { 'process.env.DEBUG': false }
  }
} as const
