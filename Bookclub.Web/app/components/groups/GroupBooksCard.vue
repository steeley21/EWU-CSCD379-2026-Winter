<template>
  <v-card class="bc-card" rounded="lg">
    <v-card-title class="gp-card-title">
      Books <span class="gp-count">({{ books.length }})</span>
    </v-card-title>

    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate color="var(--camel)" />
      <div v-else-if="error" class="gp-error">{{ error }}</div>

      <div v-else-if="!books.length" class="gp-muted">
        No books added to this group yet.
      </div>

      <div v-else class="gp-books">
        <div v-for="b in preview" :key="b.id" class="gp-book-row">
          <div class="gp-book-title">{{ String(b.title ?? 'Untitled') }}</div>
          <div class="gp-muted gp-small">{{ String(b.author ?? 'Unknown author') }}</div>
          <div v-if="b.description" class="gp-muted gp-small gp-desc">
            {{ String(b.description) }}
          </div>
        </div>

        <div v-if="books.length > preview.length" class="gp-muted gp-small">
          +{{ books.length - preview.length }} more
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { BookDto } from '~/types/dtos'

const props = defineProps<{
  books: BookDto[]
  loading: boolean
  error: string
}>()

const preview = computed(() => props.books.slice(0, 4))
</script>

<style scoped>
.gp-card-title { font-family: var(--font-display); font-weight: 700; }
.gp-count { color: var(--text-muted); font-weight: 500; margin-left: 0.25rem; }
.gp-books { display: flex; flex-direction: column; gap: 0.9rem; }
.gp-book-row {
  padding: 0.75rem 0.9rem;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg);
}
.gp-book-title {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--coffee-bean);
}
.gp-desc { margin-top: 0.35rem; line-height: 1.45; }
.gp-muted { color: var(--text-muted); }
.gp-small { font-size: 0.85rem; }
.gp-error {
  color: #b94a48;
  background: #fff5f5;
  border: 1px solid rgba(185, 74, 72, 0.25);
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
}
</style>