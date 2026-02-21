<template>
  <v-app>
    <NavBar />
    <v-main class="bc-page">
      <v-container class="py-6">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import NavBar from '~/components/common/NavBar.vue'
</script>