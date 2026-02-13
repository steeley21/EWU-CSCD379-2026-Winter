<!-- layouts/default.vue -->
<template>
  <v-layout>
    <v-main class="hf-main">
      <AppHeader />
      <slot />
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue'
</script>

<style scoped>
.hf-main {
  height: 100dvh;
  overflow-y: auto;
}
</style>
