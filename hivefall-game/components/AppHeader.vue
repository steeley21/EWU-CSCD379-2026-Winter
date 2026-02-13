<!-- components/AppHeader.vue -->
<template>
  <v-toolbar border density="comfortable" class="hf-bar">
    <v-btn
      icon="mdi-menu"
      variant="text"
      class="d-sm-none"
      aria-label="Open navigation"
      @click="drawer = !drawer"
    />

    <v-toolbar-title class="text-truncate hf-title">
      Hivefall
    </v-toolbar-title>

    <v-spacer />

    <!-- Give Up (Hivefall only) -->
    <v-btn
      v-if="isHivefall"
      variant="text"
      size="small"
      class="me-2"
      color="secondary"
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
        :class="['hf-nav-btn', { 'hf-nav-btn--active': isActive(item.to) }]"
      >
        {{ item.title }}
      </v-btn>
    </div>
  </v-toolbar>

  <!-- Mobile nav -->
  <v-navigation-drawer v-model="drawer" temporary class="d-sm-none hf-drawer-surface">
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

type NavItem = {
  title: string
  to: string
}

const drawer = ref(false)
const route = useRoute()

const { giveUpFn } = useHivefallHeaderActions()

const navItems: NavItem[] = [
  { title: 'Home', to: '/' },
  { title: 'Hivefall', to: '/hivefall' },
  { title: 'Leaderboard', to: '/leaderboard' },
  { title: 'Reviews', to: '/reviews' },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const isHivefall = computed(() => route.path === '/hivefall')

function giveUpFromHeader(): void {
  giveUpFn.value?.()
}
</script>

<style scoped>
.hf-title {
  max-width: 60vw;
  letter-spacing: 0.06em;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.96) !important;
}
</style>
