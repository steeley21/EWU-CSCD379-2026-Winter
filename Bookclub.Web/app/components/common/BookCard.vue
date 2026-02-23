<!-- app/components/common/BookCard.vue -->
<template>
  <v-card
    class="bc-card book-card"
    rounded="lg"
    :to="to"
    :link="Boolean(to)"
    hover
  >
    <div class="cover-wrap">
      <BookCover :book="book" size="M" :icon-size="18" />
    </div>

    <v-card-title class="text-subtitle-1">
      {{ title }}
    </v-card-title>

    <v-card-subtitle class="bc-muted">
      {{ author }}
    </v-card-subtitle>

    <v-card-text class="bc-muted meta">
      <span v-if="year">Year: {{ year }}</span>
      <span v-if="isbn"> • ISBN: {{ isbn }}</span>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { BookDto } from '~/types/dtos'
import { authorLabel, extractIsbn, publishYearLabel } from '~/utils/books'
import BookCover from '~/components/common/BookCover.vue'

const props = defineProps<{
  book: BookDto
  to?: string
}>()

const title = computed(() => String(props.book.title ?? 'Untitled'))
const author = computed(() => authorLabel(props.book))
const year = computed(() => publishYearLabel(props.book))
const isbn = computed(() => extractIsbn(props.book))
</script>

<style scoped>
.book-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.cover-wrap {
  padding: 0.9rem 0.9rem 0.25rem;
}

.meta {
  min-height: 44px;
  margin-top: auto; /* keeps bottom line aligned when titles wrap */
}
</style>