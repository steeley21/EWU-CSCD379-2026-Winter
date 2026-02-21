<template>
  <div>
    <h1 class="text-h5 mb-4">Your Dashboard</h1>
    <v-alert type="info" variant="tonal">
      Groups UI scaffold next: list groups you belong to, create group, join by ID.
    </v-alert>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
</script>