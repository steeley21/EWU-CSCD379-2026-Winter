// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    build: {
        transpile: ['vuetify'],
    },
    modules: ["vuetify-nuxt-module"],
    vuetify: {

    },
    vite: {
        server: {
            host: 'localhost',
            hmr: {
                port: 24680
            }
        }
    }
})

