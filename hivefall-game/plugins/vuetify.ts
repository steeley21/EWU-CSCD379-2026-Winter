// plugins/vuetify.ts
import { defineNuxtPlugin, useCookie } from '#app'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

type ThemeName = 'light' | 'dark'
const THEME_COOKIE = 'hf-theme'

export default defineNuxtPlugin((nuxtApp) => {
  const themeCookie = useCookie<ThemeName>(THEME_COOKIE, { default: () => 'light' })
  const startTheme: ThemeName = themeCookie.value === 'dark' ? 'dark' : 'light'

  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: startTheme,
      themes: {
        light: {
          dark: false,
          colors: {
            background: '#FAFAFC',
            surface: '#FFFFFF',
            primary: '#5E35B1',
            secondary: '#00ACC1',
            error: '#E53935',
            warning: '#FB8C00',
            info: '#1E88E5',
            success: '#43A047',
          },
        },
        dark: {
          dark: true,
          colors: {
            background: '#0E0F12',
            surface: '#16181D',
            primary: '#B39DDB',
            secondary: '#4DD0E1',
            error: '#EF5350',
            warning: '#FFB74D',
            info: '#64B5F6',
            success: '#81C784',
          },
        },
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
