<template>
  <v-app-bar density="comfortable" flat>
    <v-container class="d-flex align-center">
      <v-app-bar-title class="text-no-wrap">Book Club</v-app-bar-title>

      <v-spacer />

      <v-btn variant="text" to="/">Home</v-btn>
      <v-btn v-if="auth.isAuthenticated" variant="text" to="/dashboard">Dashboard</v-btn>
      <v-btn v-if="auth.isAuthenticated && auth.isAdmin" variant="text" to="/admin">Admin</v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        v-if="!auth.isAuthenticated"
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

const auth = useAuthStore()
auth.hydrate()

function doLogout() {
  auth.logout()
  navigateTo('/')
}
</script>