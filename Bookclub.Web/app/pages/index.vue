<template>
  <div>
    <v-row class="mb-6" align="center">
      <v-col cols="12" md="7">
        <h1 class="text-h4 mb-2">What our users are reading now</h1>
        <p class="bc-muted">
          Explore the newest books added to Book Club. Log in to join groups, build libraries, and schedule meetings.
        </p>
      </v-col>

      <v-col cols="12" md="5" class="d-flex justify-md-end">
        <v-btn v-if="!auth.isAuthenticated" color="primary" size="large" to="/login">
          Get Started
        </v-btn>
        <v-btn v-else color="primary" size="large" to="/dashboard">
          Go to Dashboard
        </v-btn>
      </v-col>
    </v-row>

    <v-card class="bc-card" rounded="lg">
      <v-card-title>Featured Books</v-card-title>
      <v-card-text>
        <v-progress-linear v-if="pending" indeterminate />
        <v-alert v-else-if="error" type="error" variant="tonal">
          Failed to load books. Is the API running on https://localhost:5000 ?
        </v-alert>

        <v-row v-else>
          <v-col
            v-for="b in featured"
            :key="String(b.id)"
            cols="12"
            sm="6"
            md="4"
          >
            <BookCard :book="b" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { booksService } from '~/services/booksService'
import { useAuthStore } from '~/stores/authStore'
import BookCard from '~/components/common/BookCard.vue'
import type { BookDto } from '~/types/dtos'

const auth = useAuthStore()
auth.hydrate()

const { data, pending, error } = await useAsyncData<BookDto[]>(
  'books',
  () => booksService.getAll(),
  { server: false } // avoid SSR calling localhost
)

const featured = computed(() => {
  const books = data.value ?? []
  const sorted = [...books].sort((a, b) => {
    const da = Date.parse(String(a.createdAt ?? ''))
    const db = Date.parse(String(b.createdAt ?? ''))
    const aValid = Number.isFinite(da)
    const bValid = Number.isFinite(db)
    if (aValid && bValid) return db - da
    return (Number(b.id ?? 0) - Number(a.id ?? 0))
  })
  return sorted.slice(0, 6)
})
</script>