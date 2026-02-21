<template>
  <v-card class="bc-card" rounded="lg">
    <v-card-title class="text-subtitle-1">
      {{ title }}
    </v-card-title>
    <v-card-subtitle class="bc-muted">
      {{ author }}
    </v-card-subtitle>
    <v-card-text class="bc-muted">
      <span v-if="desc">{{ desc }}</span>
      <span v-else>No description.</span>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { BookDto } from '~/types/dtos'

const props = defineProps<{ book: BookDto }>()

const title = computed(() => String(props.book.title ?? 'Untitled'))
const author = computed(() => String(props.book.author ?? 'Unknown author'))
const desc = computed(() => {
  const d = props.book.description
  return typeof d === 'string' && d.trim().length ? d : ''
})
</script>