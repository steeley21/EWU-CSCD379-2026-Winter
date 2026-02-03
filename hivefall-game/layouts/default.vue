<template>
  <v-layout>
    <v-main>
      <AppHeader />
      <slot />
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import AppHeader from '~/components/AppHeader.vue'
</script>
