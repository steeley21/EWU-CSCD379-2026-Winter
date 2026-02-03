<template>
  <v-toolbar border density="comfortable">
    <v-btn
      icon="mdi-menu"
      variant="text"
      class="d-sm-none"
      aria-label="Open navigation"
      @click="drawer = !drawer"
    />

    <v-toolbar-title class="text-truncate hf-title">
      Smiley’s Hivefall
    </v-toolbar-title>


    <v-spacer />

    <!-- Theme toggle -->
    <v-btn
      :icon="themeIcon"
      variant="text"
      class="me-1"
      :aria-label="themeLabel"
      @click="toggleTheme"
    />



    <!-- Reset (Hivefall only) -->
    <v-btn
        v-if="isHivefall"
        variant="outlined"
        size="small"
        class="me-2"
        @click="resetFromHeader"
    >
        Reset
    </v-btn>

    <!-- Give Up (Hivefall only) -->
    <v-btn
        v-if="isHivefall"
        variant="text"
        size="small"
        class="me-2"
        @click="giveUpFromHeader"
    >
        Give Up
    </v-btn>


    <!-- Desktop nav -->
    <div class="d-none d-sm-flex ga-1">
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :variant="isActive(item.to) ? 'outlined' : 'text'"
      >
        {{ item.title }}
      </v-btn>
    </div>
  </v-toolbar>

  <!-- Mobile nav -->
  <v-navigation-drawer v-model="drawer" temporary class="d-sm-none">
    <v-list nav density="comfortable">
      <v-list-item
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :active="isActive(item.to)"
        @click="drawer = false"
      >
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHivefallHeaderActions } from '../composables/useHivefallHeaderActions'
import { useAppTheme } from '../composables/useAppTheme'

type NavItem = {
  title: string
  to: string
}

const drawer = ref(false)
const route = useRoute()

const { resetFn, giveUpFn } = useHivefallHeaderActions()

const navItems: NavItem[] = [
  { title: 'Home', to: '/' },
  { title: 'Hivefall', to: '/hivefall' },
  { title: 'Leaderboard', to: '/leaderboard' },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const isHivefall = computed(() => route.path === '/hivefall')

function resetFromHeader(): void {
  resetFn.value?.()
}
function giveUpFromHeader(): void {
  giveUpFn.value?.()
}

// Theme
const { isDark, toggleTheme } = useAppTheme()
const themeIcon = computed(() => (isDark.value ? 'mdi-weather-sunny' : 'mdi-weather-night'))
const themeLabel = computed(() => (isDark.value ? 'Switch to light mode' : 'Switch to dark mode'))
</script>

<style scoped>
.hf-title {
  max-width: 60vw; /* gives space for right-side buttons on small screens */
}
</style>