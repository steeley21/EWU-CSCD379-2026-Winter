<template>
  <v-app-bar density="comfortable" flat>
    <v-container class="d-flex align-center">
      <v-app-bar-title class="text-no-wrap">Book Club</v-app-bar-title>

      <v-spacer />

      <v-btn variant="text" to="/">Home</v-btn>
      <v-btn v-if="isAuthenticated" variant="text" to="/dashboard">Dashboard</v-btn>
      <v-btn v-if="isAuthenticated && isAdmin" variant="text" to="/admin">Admin</v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        v-if="!isAuthenticated"
        color="primary"
        variant="flat"
        to="/login"
      >
        Login
      </v-btn>

      <v-btn
        v-else
        variant="outlined"
        @click="doLogout"
      >
        Logout
      </v-btn>
    </v-container>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

// Pinia is not available during SSR in layouts/components outside pages.
// We defer store access to the client only.
const isAuthenticated = ref(false)
const isAdmin = ref(false)

let authStore: ReturnType<typeof useAuthStore> | null = null

onMounted(() => {
  if (process.client) {
    authStore = useAuthStore()
    authStore.hydrate()

    // Sync reactive refs from store
    isAuthenticated.value = authStore.isAuthenticated
    isAdmin.value = authStore.isAdmin

    // Keep in sync if store state changes (e.g. after login/logout)
    watch(
      () => authStore!.isAuthenticated,
      (val) => { isAuthenticated.value = val },
    )
    watch(
      () => authStore!.isAdmin,
      (val) => { isAdmin.value = val },
    )
  }
})

function doLogout() {
  authStore?.logout()
  navigateTo('/')
}
</script>