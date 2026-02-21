<template>
  <div class="landing-page">
    <div class="hero-section">
      <div class="hero-content">
        <div class="eyebrow">Book Club</div>
        <h1 class="hero-title">What our users<br><em>are reading now</em></h1>
        <p class="hero-sub">
          Explore the newest books added to Book Club. Log in to join groups,
          build libraries, and schedule meetings.
        </p>

        <div class="hero-cta">
          <v-btn
            v-if="!auth.isAuthenticated"
            size="large"
            to="/login"
            class="cta-btn"
            rounded="pill"
            elevation="0"
          >
            Get Started →
          </v-btn>
          <v-btn
            v-else
            size="large"
            to="/dashboard"
            class="cta-btn"
            rounded="pill"
            elevation="0"
          >
            Go to Dashboard →
          </v-btn>
        </div>
      </div>

      <div class="hero-decoration" aria-hidden="true">
        <div class="deco-circle deco-1" />
        <div class="deco-circle deco-2" />
        <div class="deco-ring" />
      </div>
    </div>

    <div class="books-section">
      <div class="section-header">
        <h2 class="section-title">Featured Books</h2>
        <div class="title-line" />
      </div>

      <v-progress-linear v-if="pending" indeterminate rounded class="mb-6" color="var(--coffee-bean)" />

      <v-alert v-else-if="error" type="error" variant="tonal" rounded="lg" class="mb-6">
        Failed to load books. Is the API running on <code>https://localhost:5000</code>?
      </v-alert>

      <v-row v-else>
        <v-col v-for="b in featured" :key="String(b.id)" cols="12" sm="6" md="4">
          <BookCard :book="b" />
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
import { booksService } from '~/services/booksService'
import BookCard from '~/components/common/BookCard.vue'
import type { BookDto } from '~/types/dtos'

const auth = useAuthStore()
auth.hydrate()

const { data, pending, error } = await useAsyncData<BookDto[]>(
  'books',
  () => booksService.getAll(),
  { server: false }
)

const featured = computed(() => {
  const books = data.value ?? []
  const sorted = [...books].sort((a, b) => {
    const da = Date.parse(String(a.createdAt ?? ''))
    const db = Date.parse(String(b.createdAt ?? ''))
    const aValid = Number.isFinite(da)
    const bValid = Number.isFinite(db)
    if (aValid && bValid) return db - da
    return Number(b.id ?? 0) - Number(a.id ?? 0)
  })
  return sorted.slice(0, 6)
})
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 clamp(1.5rem, 5vw, 4rem);
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* ── Hero ── */
.hero-section {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 50vh;
  padding: clamp(3rem, 8vh, 6rem) 0 clamp(2rem, 5vh, 4rem);
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 620px;
}

.eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dusty-olive);
  margin-bottom: 1rem;
}

.hero-title {
  font-size: clamp(2.25rem, 5vw, 3.75rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 1.25rem;
  color: var(--coffee-bean);
}

.hero-title em {
  font-style: italic;
  color: var(--camel);
}

.hero-sub {
  font-size: 1.0625rem;
  line-height: 1.65;
  color: rgba(0, 0, 0, 0.55);
  max-width: 500px;
  margin-bottom: 2.25rem;
}

.cta-btn {
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.01em;
  padding: 0 2rem !important;
  height: 52px !important;
  background-color: var(--coffee-bean) !important;
  color: #fff !important;
}

.cta-btn:hover {
  background-color: var(--camel) !important;
}

/* Decorative shapes using theme colors */
.hero-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: var(--ash-grey);
}

.deco-1 {
  width: 480px;
  height: 480px;
  right: -120px;
  top: -80px;
  opacity: 0.18;
}

.deco-2 {
  width: 260px;
  height: 260px;
  right: 160px;
  bottom: -40px;
  opacity: 0.1;
  background: var(--pale-oak);
}

.deco-ring {
  position: absolute;
  width: 320px;
  height: 320px;
  right: 60px;
  top: 40px;
  border-radius: 50%;
  border: 2px solid var(--camel);
  opacity: 0.2;
}

/* ── Books ── */
.books-section {
  padding-bottom: clamp(3rem, 8vh, 6rem);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
  color: var(--coffee-bean);
}

.title-line {
  flex: 1;
  height: 1px;
  background: var(--pale-oak);
}
</style>