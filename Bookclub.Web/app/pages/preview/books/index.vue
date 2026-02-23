<template>
  <div class="preview-page">
    <div class="preview-header">
      <div class="eyebrow">Preview</div>
      <h1 class="title">Book Preview</h1>
      <p class="sub">Discover recent picks from our BookClub community.</p>

      <div class="controls">
        <v-text-field
          v-model="query"
          label="Search title, author, ISBN, year"
          density="comfortable"
          variant="outlined"
          hide-details
        />
        <v-select
          v-model="sort"
          :items="sortItems"
          label="Sort"
          density="comfortable"
          variant="outlined"
          hide-details
          style="max-width: 200px"
        />
      </div>
    </div>

    <v-progress-linear v-if="pending" indeterminate color="var(--camel)" class="mb-4" />

    <v-alert v-else-if="pageError" type="error" variant="tonal" rounded="lg" class="mb-4">
      {{ pageError }}
    </v-alert>

    <div v-else-if="books.length === 0" class="empty">
      No books found.
    </div>

    <v-row v-else dense class="align-stretch">
      <v-col v-for="b in books" :key="String(b.id)" cols="12" sm="6" md="4" lg="3">
        <BookCard :book="b" :to="`/preview/books/${b.id}`" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import BookCard from '~/components/common/BookCard.vue'
import { useBooksPreview } from '~/composables/useBooksPreview'

const { books, pending, pageError, query, sort } = useBooksPreview()

const sortItems = [
  { title: 'Title', value: 'title' },
  { title: 'Author', value: 'author' },
  { title: 'Year', value: 'year' },
  { title: 'Newest (id)', value: 'id' },
]
</script>

<style scoped>
.preview-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem clamp(1.5rem, 5vw, 4rem) 3rem;
}

.preview-header {
  margin-bottom: 1rem;
}

.eyebrow {
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--dusty-olive);
}

.title {
  font-family: var(--font-display);
  color: var(--coffee-bean);
  font-weight: 900;
  margin: 0.25rem 0 0.25rem;
}

.sub {
  color: var(--text-muted);
  max-width: 70ch;
  margin-bottom: 1rem;
}

.controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.empty {
  color: var(--text-muted);
  padding: 1rem 0;
}
</style>