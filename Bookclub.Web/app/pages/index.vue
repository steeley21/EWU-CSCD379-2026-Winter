<template>
  <div class="landing-page">

    <!-- ── Hero ── -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="eyebrow">Book Club</div>

        <h1 class="hero-title">
          A place to read,
          <span class="title-accent"><em>share, and belong.</em></span>
        </h1>

        <p class="hero-sub">
          Join a community of readers who love getting lost in a good book.
          Discover new titles, connect with fellow members, build your personal
          library, and schedule your next meetup — all in one warm corner of the web.
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

          <a
            v-if="!auth.isAuthenticated"
            href="#featured"
            class="cta-secondary"
          >Browse books first</a>
        </div>
      </div>

      <!-- Illustrated book stack panel -->
      <div class="hero-visual" aria-hidden="true">
        <div class="book-stack">
          <div class="book-card-deco b1">
            <div class="spine" />
          </div>
          <div class="book-card-deco b2">
            <div class="spine" />
          </div>
          <div class="book-card-deco b3">
            <div class="spine" />
            <div class="cover-title">The Art of<br>Slow Reading</div>
            <div class="cover-author">Community Picks</div>
          </div>
        </div>

        <div class="hero-badge">
          <strong>1,200+</strong>
          books in our growing library
        </div>
      </div>

      <!-- Background decoration -->
      <div class="hero-decoration" aria-hidden="true">
        <div class="deco-circle deco-1" />
        <div class="deco-circle deco-2" />
        <div class="deco-ring" />
      </div>
    </section>

    <!-- ── Trust Bar ── -->
    <div class="trust-bar">
      <span class="trust-item"><strong>500+</strong>&nbsp;Active Members</span>
      <div class="trust-divider" />
      <span class="trust-item"><strong>40+</strong>&nbsp;Reading Groups</span>
      <div class="trust-divider" />
      <span class="trust-item"><strong>Monthly</strong>&nbsp;Meetups Scheduled</span>
      <div class="trust-divider" />
      <span class="trust-item"><strong>Free</strong>&nbsp;to Join</span>
    </div>

    <!-- ── Features ── -->
    <section class="features-section">
      <div class="section-header">
        <span class="section-label">Everything you need</span>
        <div class="title-line" />
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📚</div>
          <div class="feature-title">Personal Library</div>
          <p class="feature-desc">
            Track every book you've read, want to read, or are currently enjoying.
            Your shelf, beautifully organised.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">👥</div>
          <div class="feature-title">Reading Groups</div>
          <p class="feature-desc">
            Join existing clubs or create your own. Invite friends, choose a book
            together, and never read alone again.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🗓️</div>
          <div class="feature-title">Meeting Scheduler</div>
          <p class="feature-desc">
            Coordinate meetups with ease. Set times, share agendas, and keep
            everyone on the same page — literally.
          </p>
        </div>
      </div>
    </section>

    <!-- ── Quote Banner ── -->
    <div class="quote-banner">
      <div class="quote-mark" aria-hidden="true">"</div>
      <p class="quote-text">
        A reader lives a thousand lives before he dies. The man who never reads
        lives only one.
      </p>
      <div class="quote-attr">— George R.R. Martin</div>
    </div>

    <!-- ── Featured Books ── -->
    <section id="featured" class="books-section">
      <div class="section-header">
        <h2 class="section-title">Featured Books</h2>
        <div class="title-line" />
      </div>

      <v-progress-linear
        v-if="pending"
        indeterminate
        rounded
        class="status-bar"
        color="var(--camel)"
      />

      <v-alert
        v-else-if="error"
        type="error"
        variant="tonal"
        rounded="lg"
        class="status-bar"
      >
        Failed to load books. Is the API running on
        <code>https://localhost:5000</code>?
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
    </section>

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

<style src="~/assets/index.css" />