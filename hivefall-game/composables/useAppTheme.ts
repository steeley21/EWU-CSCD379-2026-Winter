// composables/useAppTheme.ts
import { computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'

type ThemeName = 'light' | 'dark'
const THEME_COOKIE = 'hf-theme'

export function useAppTheme() {
  const vuetifyTheme = useTheme()
  const themeCookie = useCookie<ThemeName>(THEME_COOKIE, { default: () => 'light' })

  const themeName = computed<ThemeName>(() => (themeCookie.value === 'dark' ? 'dark' : 'light'))
  const isDark = computed(() => themeName.value === 'dark')

  function setTheme(name: ThemeName): void {
    themeCookie.value = name
    vuetifyTheme.global.name.value = name
  }

  function toggleTheme(): void {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  // Keep Vuetify synced after hydration
  onMounted(() => {
    setTheme(themeName.value)
  })

  return { themeName, isDark, setTheme, toggleTheme }
}
