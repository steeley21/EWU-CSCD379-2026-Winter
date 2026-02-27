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

    <!-- Title -->
    <div class="book-title">
      <div class="book-title-text">
        {{ title }}
      </div>
    </div>

    <!-- Author -->
    <div class="bc-muted book-author">
      {{ author }}
    </div>

    <!-- Footer (always reserved space so cards match) -->
    <div class="book-footer">
      <BookRatingSummary
        v-if="hasRating"
        class="book-rating"
        :avg="book.avgRating ?? null"
        :count="book.reviewCount ?? 0"
      />
      <div v-else class="book-rating-placeholder" />

      <div v-if="commentLine" class="book-comment">
        {{ commentLine }}
      </div>
      <div v-else class="book-comment-placeholder" />
    </div>
  </v-card>
</template>

<script setup lang="ts">
import type { BookDto } from '~/types/dtos'
import { authorLabel } from '~/utils/books'
import BookCover from '~/components/common/BookCover.vue'
import BookRatingSummary from '~/components/groups/BookRatingSummary.vue'

const props = defineProps<{ book: BookDto; to?: string }>()

const title = computed(() => String(props.book.title ?? 'Untitled'))
const author = computed(() => authorLabel(props.book))

const hasRating = computed(() => Number((props.book as any).reviewCount ?? 0) > 0)

const commentLine = computed(() => {
  const c = (props.book as any).latestCommentPreview as string | undefined | null
  if (!c) return null
  const name = ((props.book as any).latestCommentFirstName as string | undefined | null) ?? 'Anonymous'
  return `${name}: “${c}”`
})
</script>

<style scoped>
.book-card{
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Cover */
.cover-wrap{
  padding: 0.9rem 0.9rem 0.35rem;
}

/* Title (don’t use v-card-title; it fights wrapping) */
.book-title{
  padding: 0.25rem 1rem 0.15rem;
}

.book-title-text{
  font-family: var(--font-display);
  font-weight: 900;
  color: var(--coffee-bean);
  line-height: 1.15;
  font-size: 1.05rem;

  /* ✅ critical: allow wrapping + prevent overflow */
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  min-width: 0;

  /* ✅ clamp to 2 lines */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Author */
.book-author{
  padding: 0 1rem 0.25rem;
  margin-top: -0.15rem;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Footer: always same height for consistent cards */
.book-footer{
  margin-top: auto;
  padding: 0.35rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  /* adjust if you want more/less reserved space */
  min-height: 78px;
}

.book-rating{
  margin-top: 0.1rem;
}

/* placeholder blocks keep spacing even when missing */
.book-rating-placeholder{
  height: 22px; /* roughly matches BookRatingSummary row */
}

.book-comment{
  font-size: 0.85rem;
  line-height: 1.35;
  color: var(--text-muted);

  /* clamp comment so it doesn’t change card height */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-comment-placeholder{
  height: 36px; /* space for ~2 lines of comment */
}
</style>