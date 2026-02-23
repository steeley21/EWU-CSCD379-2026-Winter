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
      <v-responsive :aspect-ratio="2 / 3" class="cover-frame rounded">
        <v-img
          v-if="coverUrl(book)"
          :src="coverUrl(book)!"
          class="cover-img"
          :alt="String(book.title ?? 'Book cover')"
        >
          <template #error>
            <div class="cover-placeholder">
              <v-icon icon="mdi-book-open-page-variant" size="18" />
            </div>
          </template>
        </v-img>

        <div v-else class="cover-placeholder">
          <v-icon icon="mdi-book-open-page-variant" size="18" />
        </div>
      </v-responsive>
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
import { authorLabel, coverUrl, extractIsbn, publishYearLabel } from '~/utils/books'

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

.cover-frame {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--border);
  background: rgba(220, 201, 182, 0.12);
}

/* v-img fills the responsive frame */
.cover-img {
  width: 100%;
  height: 100%;
}

.cover-img :deep(.v-img__img) {
  object-fit: contain;
}

/* Placeholder fills the frame */
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.meta {
  min-height: 44px;
  margin-top: auto; /* keeps bottom line aligned when titles wrap */
}
</style>