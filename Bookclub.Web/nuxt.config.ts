// nuxt.config.ts
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
    modules: ['@pinia/nuxt'],
    devtools: { enabled: true },
    ssr: false,

    runtimeConfig: {
        public: {
            apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:5000',
        },
    },
    plugins: ['~/plugins/vuetify.ts'],

    css: [
        'vuetify/styles',
        '@mdi/font/css/materialdesignicons.css',
        '~/assets/bookclub-theme.css',
    ],

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