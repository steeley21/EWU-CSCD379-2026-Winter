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
  // Default to dark going forward (toggle logic still supported)
  const themeCookie = useCookie<ThemeName>(THEME_COOKIE, { default: () => 'dark' })
  const startTheme: ThemeName = themeCookie.value === 'light' ? 'light' : 'dark'

  const neonGreen = '#39FF14'
  const neonMagenta = '#FF2BD6'
  const neonCyan = '#00E5FF'

  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: startTheme,
      themes: {
        // "light" still exists for future reuse — but it stays in the same aesthetic family.
        light: {
          dark: false,
          colors: {
            background: '#0E1014',
            surface: '#151922',
            primary: neonGreen,
            secondary: neonMagenta,
            info: neonCyan,
            success: neonGreen,
            warning: '#FFB300',
            error: '#FF5252',
          },
        },
        dark: {
          dark: true,
          colors: {
            background: '#080A0D',
            surface: '#10141B',
            primary: neonGreen,
            secondary: neonMagenta,
            info: neonCyan,
            success: neonGreen,
            warning: '#FFB300',
            error: '#FF5252',
          },
        },
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
