import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
    modules: ['@pinia/nuxt'],
    devtools: { enabled: true },

    runtimeConfig: {
        public: {
            apiBase: 'http://localhost:5000',
        },
    },
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

    // Disable SSR for the whole app - this is a pure SPA talking to a .NET API.
    // Avoids hydration mismatches and Pinia-before-mount errors entirely.
    routeRules: {
        '/**': { ssr: false },
    },

    compatibilityDate: '2025-01-01',
})